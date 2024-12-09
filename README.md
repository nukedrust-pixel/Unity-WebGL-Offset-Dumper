# Unity WebGL Offset Dumper and Shader Logger

## Overview

The **Unity WebGL Offset Dumper and Shader Logger** is a userscript designed for use with Tampermonkey or similar browser extensions. This script allows users to dump memory offsets and shader source code from Unity WebGL games. It provides a user-friendly interface to log, export offsets, and load custom JavaScript code.

## Features

- **Dump Offsets**: Capture memory offsets from the currently running Unity WebGL game.
- **Shader Logging**: Log shader source code when rendering calls are made.
- **UI Interface**: Interactive UI for easy access to dumping and exporting functionalities.
- **Export Functionality**: Export found offsets to a JSON file.

## Installation

1. Install a userscript manager like [Tampermonkey](https://www.tampermonkey.net/) in your browser.
2. Create a new userscript in Tampermonkey.
3. Copy and paste the entire script from this repository into the new userscript.
4. Save the script.

## Usage

1. Navigate to any Unity WebGL game hosted on a `.io` domain (e.g., `*://*.io/*`).
2. Use the "Dump Offsets" button to capture memory offsets.
3. Export the captured offsets using the "Export Offsets" button.


