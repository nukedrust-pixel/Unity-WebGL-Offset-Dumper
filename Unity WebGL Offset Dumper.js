// ==UserScript==
// @name         Unity WebGL Offset Dumper
// @namespace    http://tampermonkey.net/
// @require      https://code.jquery.com/jquery-2.1.4.min.js
// @version      0.9
// @description  Attempt to dump offsets from Unity WebGL game with UI logging, export functionality, and enhanced UI features
// @match        https://*.io/
// @match        http://*.io/
// @grant        none
// @author       nukedrust
// @grant        window.close
// @grant        window.focus
// @grant        window.onurlchange
// ==/UserScript==

(function() {
    'use strict';

    let unityInstance = null;
    let foundOffsets = {};

    function createUI() {
        const uiContainer = document.createElement('div');
        uiContainer.id = 'offset-dumper-ui';
        uiContainer.innerHTML = `
            <div id="offset-dumper-header">
                <h2>Offset Dumper</h2>
                <div class="header-buttons">
                    <button id="dump-button" disabled>Dump Offsets</button>
                    <button id="minimize-button">_</button>
                    <button id="close-button">×</button>
                </div>
            </div>
            <div id="offset-dumper-content">
                <div id="offset-dumper-log"></div>
                <div id="offset-dumper-progress" style="display: none;">
                    <div class="progress-bar"></div>
                    <span class="progress-text">0%</span>
                </div>
            </div>
            <div id="offset-dumper-footer">
                <button id="export-button" disabled>Export Offsets</button>
                <span id="status-text">Made By nukedrust</span>
            </div>
        `;
        document.body.appendChild(uiContainer);

        const style = document.createElement('style');
        style.textContent = `
            #offset-dumper-ui {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 350px;
                height: 450px;
                background-color: #2c3e50;
                color: #ecf0f1;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                z-index: 9999;
                border-radius: 10px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
                cursor: move; /* Cursor changes to indicate draggable */
            }
            #offset-dumper-header, #offset-dumper-footer {
                padding: 15px;
                background-color: #34495e;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            #offset-dumper-header h2 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }
            .header-buttons {
                display: flex;
                gap: 10px;
            }
            #dump-button, #export-button {
                padding: 8px 15px;
                background-color: #3498db;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.2s;
                font-weight: bold;
            }
            #dump-button:hover, #export-button:hover {
                background-color: #2980b9;
            }
            #dump-button:disabled, #export-button:disabled {
                background-color: #95a5a6;
                cursor: not-allowed;
            }
            #minimize-button, #close-button {
                background: none;
                border: none;
                color: #ecf0f1;
                font-size: 18px;
                cursor: pointer;
                transition: color 0.2s;
            }
            #minimize-button:hover, #close-button:hover {
                color: #3498db;
            }
            #offset-dumper-content {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            #offset-dumper-log {
                flex-grow: 1;
                overflow-y: auto;
                padding: 15px;
                font-size: 14px;
                line-height: 1.6;
            }
            #offset-dumper-progress {
                padding: 15px;
               background-color:#34495e;
               height : auto;
               width : auto;
               display : flex;
               justify-content : center;
               align-items : center;
              }
              .progress-bar {
              height : 10px;
              background-color :#3498db;
              width : 0%;
              border-radius :5px;
              transition : width .3s ease;
             }
             .progress-text {
             display : block;
             text-align : center;
             margin-top :5px;
             font-size :12px;
           }
           #status-text {
           font-size :14px;
           color :#bdc3c7;
          }`;
        document.head.appendChild(style);

        document.getElementById('dump-button').addEventListener('click', dumpOffsets);
        document.getElementById('export-button').addEventListener('click', exportOffsets);
        document.getElementById('minimize-button').addEventListener('click', minimizeUI);
        document.getElementById('close-button').addEventListener('click', closeUI);

        let isDragging = false; // Flag for dragging state
        let dragOffsetX, dragOffsetY;

        const header = document.getElementById('offset-dumper-header');
        header.addEventListener('mousedown', startDragging);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDragging);

        function startDragging(e) {
            isDragging = true; // Set dragging state to true
            const rect = uiContainer.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left; // Calculate offset for X
            dragOffsetY = e.clientY - rect.top; // Calculate offset for Y
        }

        function drag(e) {
            if (isDragging) { // If dragging is active
                 uiContainer.style.left = (e.clientX - dragOffsetX) + 'px'; // Update X position
                 uiContainer.style.top = (e.clientY - dragOffsetY) + 'px'; // Update Y position
             }
         }

         function stopDragging() {
             isDragging = false; // Reset dragging state
         }
     }

     function log(message) {
         const logElement = document.getElementById('offset-dumper-log');
         logElement.innerHTML += message + '<br>';
         logElement.scrollTop = logElement.scrollHeight; // Scroll to bottom
     }

     function waitForUnity() {
         log(" ⚡ POWERED BY PERPLEXITY AI ⚡ ");
         log("Waiting for Unity to initialize...");
         const checkUnity = setInterval(() => {
             if (window.unityInstance) { // Check if Unity instance exists
                 clearInterval(checkUnity);
                 unityInstance = window.unityInstance; // Assign instance
                 log("Unity instance found and initialized.");
                 document.getElementById('dump-button').disabled = false; // Enable dump button
             }
         }, 1000);
     }

     function dumpOffsets() {
         log("Starting offset dump...");
         foundOffsets = {}; // Reset found offsets

         if (!unityInstance || !unityInstance.Module) { // Check instance validity
             log("Unity instance or Module not found. Please wait for Unity to fully load.");
             return; // Exit if not valid
         }

         const memory = unityInstance.Module.HEAPU8; // Access memory
         log("Memory accessed: " + memory.length + " bytes");

         for (let i = 0; i < memory.length - 4; i++) { // Search for specific pattern in memory
             if (memory[i] === 0x55 && memory[i+1] === 0x8B && memory[i+2] === 0xEC) {
                 log("Potential offset found at: 0x" + i.toString(16));
                 foundOffsets['pattern_' + i] = '0x' + i.toString(16); // Store found offset
             }
         }

         dumpStringOffsets(memory); // Dump string offsets
         dumpFloatOffsets(memory); // Dump float offsets
         dumpFunctionOffsets(unityInstance.Module); // Dump function offsets

         if (Object.keys(foundOffsets).length > 0) { // Check if any offsets were found
             document.getElementById('export-button').disabled = false; // Enable export button
         }
     }

     function dumpStringOffsets(memory) {
         log("Searching for string offsets...");
         const stringPattern = [0x48, 0x65, 0x6C, 0x6C, 0x6F]; // "Hello" in ASCII

         for (let i = 0; i < memory.length - stringPattern.length; i++) { // Search for string pattern in memory
             if (stringPattern.every((val, index) => memory[i + index] === val)) { // Check if pattern matches
                 log("Potential string offset found at: 0x" + i.toString(16));
                 foundOffsets['string_' + i] = '0x' + i.toString(16); // Store found offset
             }
         }
     }

     function dumpFloatOffsets(memory) {
         log("Searching for float offsets...");
         const floatValue = 3.14159; // Example float value to search for
         const floatArray = new Float32Array([floatValue]);
         const uint8Array = new Uint8Array(floatArray.buffer);

         for (let i = 0; i < memory.length - 4; i++) { // Search for float value in memory
             if (uint8Array.every((val, index) => memory[i + index] === val)) { // Check if value matches
                 log("Potential float offset found at: 0x" + i.toString(16));
                 foundOffsets['float_' + i] = '0x' + i.toString(16); // Store found offset
             }
         }
     }

     function dumpFunctionOffsets(module) {
         log("Dumping function offsets...");

         for (let key in module) { // Iterate through module properties
             if (typeof module[key] === 'function') { // Check if property is a function
                 try {
                     const funcPtr = module[key].toString(); // Get function's address as string

                     const match = funcPtr.match(/\[native code\]\)/); // Extract address using regex

                     if (match) {
                         const addressIndex= funcPtr.indexOf("[native code]");
                         const address= funcPtr.slice(addressIndex-10,addressIndex).trim();

                         log(`Function ${key} offset:${address}`);
                         foundOffsets['function_' + key] = address ;
                     } else {
                         log(`Couldn't extract address for function ${key}`);
                     }
                 } catch (error) {
                     log(`Error processing function ${key}: ${error.message}`);
                 }
             }
          }
      }

    function exportOffsets() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(foundOffsets, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "unity_offsets.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    function minimizeUI() {
        const content = document.getElementById('offset-dumper-content');
        const footer = document.getElementById('offset-dumper-footer');

        if (content.style.display === 'none') { // If minimized state is active
            content.style.display = 'flex';   // Show content again.
            footer.style.display='flex';       // Show footer again.

        } else {                             // If normal state is active.
           content.style.display='none';      // Hide content.
           footer.style.display='none';       // Hide footer.
           uiContainer.style.height='auto';   //
       }
    }

    function closeUI() {
        document.getElementById('offset-dumper-ui').style.display = 'none';   //
    }

    window.addEventListener('load', function() {
        setTimeout(() => {
            createUI();
            waitForUnity();
        },5000);   //
    });
})();