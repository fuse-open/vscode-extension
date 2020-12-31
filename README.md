# fuse-vscode

Fuse extension for Visual Studio Code. This plugin uses information and code from:

- https://fuseopen.com/docs/technical-corner/fuse-protocol
- https://github.com/sergiirocks/vscode-fuse-syntax

## Features

- Syntax highlighting
- Code completion
- Launch preview from commands in VS Code, including local debug
- Send selection from VS Code to Fuse Studio
- Update UX from Fuse Studio
- Diagnostics on compiler errors, list appears in the PROBLEMS-tab
- Keybindings for starting preview window
- Auto close tag ux file
- Set cursor position when auto close tag
- Set auto insert double quotes when accepting code completion and typing `=` symbol on UX property
- Lots of UX Snippets for faster and easier to code

## Extension Settings

This extension currently has no configurable settings.

## Known Issues

See issues on repository.

## Develop

Run `npm install` after cloning. Start code in the directory using `code .`. Press F5 to launch extension development sandbox.

Run `npm run build` to produce a packaged extension file (`fuse-vscode-VERSION.vsix`).
