/**
 * File Explorer Component
 * VS Code-style file tree with project management
 */

import React, { useState } from 'react';
import './FileExplorer.css';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  isOpen?: boolean;
}

interface FileExplorerProps {
  onFileSelect: (filePath: string) => void;
  onFileCreate: (parentPath: string, name: string, type: 'file' | 'folder') => void;
  onFileDelete: (path: string) => void;
  onFileRename: (oldPath: string, newName: string) => void;
}

const mockFileTree: FileNode[] = [
  {
    name: 'sherlock-project',
    type: 'folder',
    path: '/sherlock-project',
    isOpen: true,
    children: [
      {
        name: 'src',
        type: 'folder',
        path: '/sherlock-project/src',
        isOpen: true,
        children: [
          {
            name: 'components',
            type: 'folder',
            path: '/sherlock-project/src/components',
            isOpen: false,
            children: [
              { name: 'App.tsx', type: 'file', path: '/sherlock-project/src/components/App.tsx' },
              { name: 'Header.tsx', type: 'file', path: '/sherlock-project/src/components/Header.tsx' }
            ]
          },
          {
            name: 'observers',
            type: 'folder',
            path: '/sherlock-project/src/observers',
            isOpen: false,
            children: [
              { name: 'PatternKeeper.ts', type: 'file', path: '/sherlock-project/src/observers/PatternKeeper.ts' },
              { name: 'SystemsPhilosopher.ts', type: 'file', path: '/sherlock-project/src/observers/SystemsPhilosopher.ts' },
              { name: 'CosmicCartographer.ts', type: 'file', path: '/sherlock-project/src/observers/CosmicCartographer.ts' }
            ]
          },
          { name: 'index.ts', type: 'file', path: '/sherlock-project/src/index.ts' },
          { name: 'main.ts', type: 'file', path: '/sherlock-project/src/main.ts' }
        ]
      },
      {
        name: 'public',
        type: 'folder',
        path: '/sherlock-project/public',
        isOpen: false,
        children: [
          { name: 'index.html', type: 'file', path: '/sherlock-project/public/index.html' },
          { name: 'favicon.ico', type: 'file', path: '/sherlock-project/public/favicon.ico' }
        ]
      },
      { name: 'package.json', type: 'file', path: '/sherlock-project/package.json' },
      { name: 'tsconfig.json', type: 'file', path: '/sherlock-project/tsconfig.json' },
      { name: 'README.md', type: 'file', path: '/sherlock-project/README.md' }
    ]
  }
];

export const FileExplorer: React.FC<FileExplorerProps> = ({
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename
}) => {
  const [fileTree, setFileTree] = useState<FileNode[]>(mockFileTree);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null);

  const getFileIcon = (fileName: string, type: 'file' | 'folder', isOpen?: boolean) => {
    if (type === 'folder') {
      return isOpen ? '📂' : '📁';
    }
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': case 'tsx': return '🔷';
      case 'js': case 'jsx': return '🟨';
      case 'json': return '⚙️';
      case 'md': return '📝';
      case 'html': return '🌐';
      case 'css': return '🎨';
      case 'ico': return '🖼️';
      default: return '📄';
    }
  };

  const toggleFolder = (path: string) => {
    const updateNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.path === path && node.type === 'folder') {
          return { ...node, isOpen: !node.isOpen };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };
    
    setFileTree(updateNode(fileTree));
  };

  const handleFileClick = (node: FileNode) => {
    if (node.type === 'folder') {
      toggleFolder(node.path);
    } else {
      setSelectedFile(node.path);
      onFileSelect(node.path);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const renderFileNode = (node: FileNode, depth: number = 0) => {
    const isSelected = selectedFile === node.path;
    
    return (
      <div key={node.path}>
        <div
          className={`file-node ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleFileClick(node)}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          <span className="file-icon">
            {getFileIcon(node.name, node.type, node.isOpen)}
          </span>
          <span className="file-name">{node.name}</span>
        </div>
        
        {node.type === 'folder' && node.isOpen && node.children && (
          <div className="folder-children">
            {node.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="file-explorer" onClick={closeContextMenu}>
      <div className="explorer-header">
        <span className="explorer-title">EXPLORER</span>
        <div className="explorer-actions">
          <button 
            className="action-btn" 
            title="New File"
            onClick={() => onFileCreate('/sherlock-project', 'untitled.ts', 'file')}
          >
            📄
          </button>
          <button 
            className="action-btn" 
            title="New Folder"
            onClick={() => onFileCreate('/sherlock-project', 'new-folder', 'folder')}
          >
            📁
          </button>
          <button className="action-btn" title="Refresh">🔄</button>
          <button className="action-btn" title="Collapse All">📁</button>
        </div>
      </div>
      
      <div className="file-tree">
        {fileTree.map(node => renderFileNode(node))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="context-menu"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            position: 'fixed',
            zIndex: 1000
          }}
        >
          <div className="context-item" onClick={() => {
            onFileCreate(contextMenu.node.path, 'new-file.ts', 'file');
            closeContextMenu();
          }}>
            📄 New File
          </div>
          <div className="context-item" onClick={() => {
            onFileCreate(contextMenu.node.path, 'new-folder', 'folder');
            closeContextMenu();
          }}>
            📁 New Folder
          </div>
          <div className="context-divider"></div>
          <div className="context-item" onClick={() => {
            onFileRename(contextMenu.node.path, contextMenu.node.name);
            closeContextMenu();
          }}>
            ✏️ Rename
          </div>
          <div className="context-item danger" onClick={() => {
            onFileDelete(contextMenu.node.path);
            closeContextMenu();
          }}>
            🗑️ Delete
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;