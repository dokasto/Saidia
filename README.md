# Saidia - AI Teacher's Assistant

<div align="center">

![Saidia Logo](assets/icon.png)

**An AI-powered desktop application designed to revolutionize how educators manage, organize, and generate educational content.**

[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue.svg)](https://github.com/your-username/Saidia)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-35.7.0-blue.svg)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue.svg)](https://www.typescriptlang.org/)

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Development](#development) • [Documentation](#documentation)

</div>

---

## 🚀 Features

### 📚 Content Management

- **Subject Organization**: Create and manage subjects to organize your educational content
- **Multi-format Support**: Upload PDFs, Word documents, text files, markdown, and images
- **Smart File Storage**: Automatic organization with secure, platform-specific storage

### 🤖 AI-Powered Capabilities

- **Intelligent Question Generation**: Automatically generate questions from your content
- **Multiple Question Types**: Multiple choice, true/false, and fill-in-the-blank questions
- **Difficulty Levels**: Easy, medium, and hard question categorization
- **Vector Search**: Semantic search through document content using AI embeddings

### 🎯 Educational Tools

- **Question Bank**: Store and manage generated questions by subject and difficulty
- **Content Analysis**: Extract and process text from various document formats
- **Cross-platform**: Works seamlessly on Windows, macOS, and Linux

### 🔧 Technical Excellence

- **Modern Architecture**: Built with Electron, React, and TypeScript
- **Vector Database**: SQLite with sqlite-vec for efficient similarity search
- **Local AI Processing**: Integration with Ollama for local AI model processing
- **Type Safety**: Full TypeScript support with strict type checking

## 📸 Screenshots

> _Screenshots coming soon - The application features a clean, modern interface built with Mantine UI_

## 🛠️ Technology Stack

### Frontend

- **React 19.0.0** - Modern UI framework
- **TypeScript 5.8.2** - Type-safe development
- **Mantine UI 8.1.2** - Beautiful component library
- **StyleX 0.14.1** - CSS-in-JS styling
- **React Router 7.3.0** - Client-side routing

### Backend

- **Electron 35.7.0** - Cross-platform desktop framework
- **Node.js 14+** - JavaScript runtime
- **SQLite** - Lightweight database
- **sqlite-vec** - Vector similarity search
- **Better-sqlite3** - High-performance SQLite driver
- **Sequelize ORM** - Database abstraction layer

### AI/ML

- **Ollama Integration** - Local AI model processing
- **Nomic Embed Text v1.5** - Text embedding model
- **Gemma3 Models** - Question generation and processing
- **Vector Embeddings** - 384-dimensional semantic vectors

## 📦 Installation

### Prerequisites

- **Node.js** 14.x or higher
- **npm** 7.x or higher
- **Git**

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/Saidia.git
cd Saidia

# Install dependencies
npm install

# Start the development server
npm start
```

### Production Build

```bash
# Build for your current platform
npm run package

# Build for specific platforms
npm run build:mac    # macOS
npm run build:win    # Windows
npm run build:linux  # Linux
```

## 🎯 Usage

### Getting Started

1. **Create a Subject**: Start by creating a subject to organize your content
2. **Upload Files**: Add PDFs, documents, or images to your subject
3. **Generate Questions**: Use AI to automatically generate questions from your content
4. **Search Content**: Use semantic search to find relevant information
5. **Manage Questions**: Organize questions by difficulty and type

### Basic Workflow

```typescript
// Example: Creating a subject and adding content
const subject = await window.electronAPI.createSubject('Mathematics 101');

// Upload a file
const file = await window.electronAPI.createFile(
  subject.data.subject_id,
  'algebra_basics.pdf',
  '/path/to/file',
);

// Generate questions
const questions = await window.electronAPI.generateQuestions(
  subject.data.subject_id,
  {
    difficulty: 'medium',
    count: 5,
    type: 'multiple_choice',
  },
);
```

### Supported File Types

| Format     | Description              | Processing             |
| ---------- | ------------------------ | ---------------------- |
| **PDF**    | Adobe PDF documents      | Text extraction + OCR  |
| **DOCX**   | Microsoft Word documents | Native text extraction |
| **TXT**    | Plain text files         | Direct text processing |
| **MD**     | Markdown files           | Markdown parsing       |
| **Images** | JPG, PNG, HEIC, etc.     | OCR text extraction    |

## 🏗️ Architecture

Saidia follows a modern Electron architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Renderer      │    │     Main        │    │   Database      │
│   Process       │◄──►│   Process       │◄──►│   Layer         │
│                 │    │                 │    │                 │
│ • React UI      │    │ • IPC Handlers  │    │ • SQLite        │
│ • TypeScript    │    │ • File Manager  │    │ • Vector Table  │
│ • Mantine UI    │    │ • LLM Services  │    │ • Sequelize     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🧪 Development

### Project Structure

```
src/
├── main/                    # Electron main process
│   ├── database/           # Database layer
│   │   ├── connection.ts   # Database connection
│   │   ├── models/         # Sequelize models
│   │   ├── services/       # Business logic
│   │   └── ipc-handlers/   # IPC handlers
│   ├── files/              # File management
│   ├── llm/                # AI/LLM services
│   └── main.ts             # Main process entry
├── renderer/               # React frontend
│   ├── components/         # React components
│   ├── hooks/              # Custom hooks
│   └── App.tsx             # Main app component
└── constants/              # Shared constants
    ├── types.ts            # TypeScript types
    ├── events.ts           # IPC events
    └── misc.ts             # Miscellaneous constants
```

### Development Commands

```bash
# Start development server
npm start

# Build for development
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Package for distribution
npm run package
```

### Environment Variables

```bash
NODE_ENV=development|production
DEBUG_PROD=true|false
START_MINIMIZED=true|false
```

## 📚 Documentation

### Comprehensive Guides

- **[Wiki Documentation](WIKI.md)** - Complete technical documentation
- **[API Reference](WIKI.md#api-reference)** - IPC handlers and database operations
- **[Database Schema](WIKI.md#database-system)** - Database structure and relationships
- **[Development Guide](WIKI.md#development-guide)** - Contributing and development workflow

### Key Documentation Sections

- **Architecture Overview** - System design and component relationships
- **Database Operations** - CRUD operations and vector search
- **File Management** - File processing and storage
- **AI Integration** - Question generation and embeddings
- **Deployment** - Building and distributing the application

## 🤝 Contributing

This is proprietary software. For questions or support, please contact the development team.

### Development Setup

This is proprietary software. Development access is restricted to authorized team members only.

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Consistent code formatting
- **Naming**: camelCase for variables, PascalCase for components

_Note: This is proprietary software with restricted development access._

## 📄 License

This project is proprietary software. All rights reserved. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Electron** - Cross-platform desktop framework
- **React** - UI library
- **Mantine** - Component library
- **Ollama** - Local AI model processing
- **sqlite-vec** - Vector similarity search

## 📞 Support

- **Documentation**: [Wiki](WIKI.md)
- **Contact**: Please contact the development team for support and questions

---

<div align="center">

**Made with ❤️ for educators worldwide**

_Proprietary software - All rights reserved_

</div>
