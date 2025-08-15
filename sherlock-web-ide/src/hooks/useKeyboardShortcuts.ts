/**
 * Keyboard Shortcuts Hook
 * Provides IDE-wide keyboard shortcuts for enhanced productivity
 */

import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find(shortcut => {
        return (
          shortcut.key.toLowerCase() === event.key.toLowerCase() &&
          !!shortcut.ctrlKey === event.ctrlKey &&
          !!shortcut.shiftKey === event.shiftKey &&
          !!shortcut.altKey === event.altKey &&
          !!shortcut.metaKey === event.metaKey
        );
      });

      if (matchingShortcut) {
        event.preventDefault();
        event.stopPropagation();
        matchingShortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
};

// Common IDE shortcuts
export const createIDEShortcuts = (actions: {
  newFile?: () => void;
  openFile?: () => void;
  saveFile?: () => void;
  saveAllFiles?: () => void;
  closeFile?: () => void;
  toggleTerminal?: () => void;
  toggleSidebar?: () => void;
  openCommandPalette?: () => void;
  openSettings?: () => void;
  focusEditor?: () => void;
  focusTerminal?: () => void;
  nextTab?: () => void;
  previousTab?: () => void;
  duplicateLine?: () => void;
  deleteLine?: () => void;
  commentLine?: () => void;
  formatDocument?: () => void;
  findInFile?: () => void;
  findInProject?: () => void;
  replaceInFile?: () => void;
  goToLine?: () => void;
  toggleWhisperHUD?: () => void;
}): KeyboardShortcut[] => {
  const shortcuts: KeyboardShortcut[] = [];

  // File operations
  if (actions.newFile) {
    shortcuts.push({
      key: 'n',
      ctrlKey: true,
      action: actions.newFile,
      description: 'New File'
    });
  }

  if (actions.openFile) {
    shortcuts.push({
      key: 'o',
      ctrlKey: true,
      action: actions.openFile,
      description: 'Open File'
    });
  }

  if (actions.saveFile) {
    shortcuts.push({
      key: 's',
      ctrlKey: true,
      action: actions.saveFile,
      description: 'Save File'
    });
  }

  if (actions.saveAllFiles) {
    shortcuts.push({
      key: 's',
      ctrlKey: true,
      shiftKey: true,
      action: actions.saveAllFiles,
      description: 'Save All Files'
    });
  }

  if (actions.closeFile) {
    shortcuts.push({
      key: 'w',
      ctrlKey: true,
      action: actions.closeFile,
      description: 'Close File'
    });
  }

  // Panel toggles
  if (actions.toggleTerminal) {
    shortcuts.push({
      key: '`',
      ctrlKey: true,
      action: actions.toggleTerminal,
      description: 'Toggle Terminal'
    });
  }

  if (actions.toggleSidebar) {
    shortcuts.push({
      key: 'b',
      ctrlKey: true,
      action: actions.toggleSidebar,
      description: 'Toggle Sidebar'
    });
  }

  // Command palette and settings
  if (actions.openCommandPalette) {
    shortcuts.push({
      key: 'p',
      ctrlKey: true,
      shiftKey: true,
      action: actions.openCommandPalette,
      description: 'Open Command Palette'
    });
  }

  if (actions.openSettings) {
    shortcuts.push({
      key: ',',
      ctrlKey: true,
      action: actions.openSettings,
      description: 'Open Settings'
    });
  }

  // Focus management
  if (actions.focusEditor) {
    shortcuts.push({
      key: '1',
      ctrlKey: true,
      action: actions.focusEditor,
      description: 'Focus Editor'
    });
  }

  if (actions.focusTerminal) {
    shortcuts.push({
      key: '2',
      ctrlKey: true,
      action: actions.focusTerminal,
      description: 'Focus Terminal'
    });
  }

  // Tab navigation
  if (actions.nextTab) {
    shortcuts.push({
      key: 'Tab',
      ctrlKey: true,
      action: actions.nextTab,
      description: 'Next Tab'
    });
  }

  if (actions.previousTab) {
    shortcuts.push({
      key: 'Tab',
      ctrlKey: true,
      shiftKey: true,
      action: actions.previousTab,
      description: 'Previous Tab'
    });
  }

  // Editor operations
  if (actions.duplicateLine) {
    shortcuts.push({
      key: 'd',
      ctrlKey: true,
      shiftKey: true,
      action: actions.duplicateLine,
      description: 'Duplicate Line'
    });
  }

  if (actions.deleteLine) {
    shortcuts.push({
      key: 'x',
      ctrlKey: true,
      shiftKey: true,
      action: actions.deleteLine,
      description: 'Delete Line'
    });
  }

  if (actions.commentLine) {
    shortcuts.push({
      key: '/',
      ctrlKey: true,
      action: actions.commentLine,
      description: 'Toggle Comment'
    });
  }

  if (actions.formatDocument) {
    shortcuts.push({
      key: 'f',
      ctrlKey: true,
      shiftKey: true,
      action: actions.formatDocument,
      description: 'Format Document'
    });
  }

  // Search operations
  if (actions.findInFile) {
    shortcuts.push({
      key: 'f',
      ctrlKey: true,
      action: actions.findInFile,
      description: 'Find in File'
    });
  }

  if (actions.findInProject) {
    shortcuts.push({
      key: 'f',
      ctrlKey: true,
      shiftKey: true,
      action: actions.findInProject,
      description: 'Find in Project'
    });
  }

  if (actions.replaceInFile) {
    shortcuts.push({
      key: 'h',
      ctrlKey: true,
      action: actions.replaceInFile,
      description: 'Replace in File'
    });
  }

  if (actions.goToLine) {
    shortcuts.push({
      key: 'g',
      ctrlKey: true,
      action: actions.goToLine,
      description: 'Go to Line'
    });
  }

  // Sherlock-specific shortcuts
  if (actions.toggleWhisperHUD) {
    shortcuts.push({
      key: 'k',
      ctrlKey: true,
      shiftKey: true,
      action: actions.toggleWhisperHUD,
      description: 'Toggle Whisper HUD'
    });
  }

  return shortcuts;
};

export default useKeyboardShortcuts;