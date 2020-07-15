# Change Log
All notable changes to the "fuse-vscode" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## 0.5.0

- Refactor source files & reorganize folders
- update uno language definition, add surrounding pairs information and add `@{@}` auto closing pair
- Add Auto Close Tag functionality, not relying another plugin such as "Auto Close Tag" plugin by Jun Han to do auto close tag ux files.
- Set cursor position in the correct position when auto close tag

## 0.0.2

- < and > were removed from auto closing brackets in UX, to make the plugin play nicer with the "Auto Close Tag" plugin by Jun Han and as to not trip up inside of `JavaScript`-tags
- The keybindings for `F5` and `Ctrl-F5` were removed, as they activate immediately, prior to the actual activation of the plugin

## 0.0.1
- Initial release