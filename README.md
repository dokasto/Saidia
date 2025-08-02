# Saidia - AI Teacher's Assistant

Saidia is an AI-powered desktop application designed to empower educators in low-connectivity regions with powerful AI capabilities. It provides an intuitive interface for uploading documents and automatically generating various types of questions - all running locally on your device without requiring internet connectivity.

## 🚀 Features

- **🌐 Offline-First Design**: Works completely offline - perfect for low-connectivity regions
- **📚 Document Upload**: Support for multiple file formats (PDF, DOC, DOCX, TXT, MD, ODT)
- **🤖 AI-Powered Question Generation**: Automatically generates questions from uploaded materials
- **📝 Multiple Question Types**: Multiple choice, true/false, and fill-in-the-blank questions
- **📊 Difficulty Levels**: Easy, medium, and hard difficulty settings
- **📁 Subject Organization**: Organize materials and questions by subject
- **💻 Local AI Processing**: Uses Ollama for on-device AI processing - no cloud dependencies
- **🖥️ Cross-Platform**: Works on Windows, macOS, and Linux
- **🔒 Privacy-First**: All data stays on your device - no data sent to external servers

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Mantine UI
- **Backend**: Electron, Node.js
- **AI**: Ollama (local LLM processing)
- **Database**: SQLite (local storage)
- **Styling**: StyleX, PostCSS

## 📋 Prerequisites

- **Node.js** (>= 14.x)
- **npm** (>= 7.x)
- **Ollama** (for local AI processing)
- **Internet connection** (only for initial setup and model download)

### Installing Ollama

**macOS:**

```bash
# Download and install from https://ollama.ai
# Or use Homebrew
brew install ollama
```

**Windows:**

```bash
# Download from https://ollama.ai/download
# Extract and run the installer
```

**Linux:**

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

## 🚀 Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Saidia
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Download AI models (one-time setup)**

   ```bash
   # Start Ollama service
   ollama serve

   # In a new terminal, pull the required models
   # This requires internet connection but only needs to be done once
   ollama pull gemma3n:e4b-it-fp16
   ollama pull gemma3n:e2b-it-q4_K_M
   ollama pull nomic-embed-text:v1.5
   ```

4. **Start the application**
   ```bash
   npm start
   ```

> **💡 Pro Tip**: Once the AI models are downloaded, Saidia works completely offline. Perfect for classrooms with limited or no internet access!

## 🌍 Perfect for Low-Connectivity Regions

Saidia is specifically designed for educators working in areas with limited or unreliable internet access:

- **🔌 Works Offline**: Once set up, no internet connection required
- **📱 Local Processing**: All AI processing happens on your device
- **💾 Local Storage**: All data and questions stored locally
- **🚀 Fast Performance**: No waiting for cloud responses
- **🔒 Privacy Protected**: No data leaves your device
- **💰 Cost Effective**: No ongoing cloud service fees

### Ideal Use Cases:

- **Rural Schools**: Where internet connectivity is unreliable
- **Remote Classrooms**: Areas with limited infrastructure
- **Budget-Conscious Institutions**: Avoiding cloud service costs
- **Privacy-Focused Environments**: Where data security is paramount

## 📖 Usage

### Getting Started

1. **Launch the app** - The application will open with a splash screen
2. **Navigate to Dashboard** - Click through to access the main interface
3. **Create a Subject** - Use the side menu to create and manage subjects

> **🌐 Offline Ready**: After initial setup, Saidia works entirely offline. No internet connection required for daily use!

### Uploading Documents

1. **Select a Subject** - Choose or create a subject from the side menu
2. **Upload Files** - Click "Upload files for this subject" to add your course materials
3. **Supported Formats** - PDF, DOC, DOCX, TXT, MD, ODT files are supported

### Generating Questions

1. **Configure Settings** - Select question type, difficulty, and number of questions
2. **Generate Questions** - Click "Generate" to create questions from your materials
3. **Review & Edit** - Edit generated questions before saving them
4. **Save Questions** - Questions are saved to your local database

### Managing Questions

- **View All Questions** - See all generated questions in the questions table
- **Edit Questions** - Modify questions directly in the interface
- **Delete Questions** - Remove unwanted questions as needed

## 🏗️ Development

### Available Scripts

- `npm start` - Start the development server
- `npm run build` - Build the application for production
- `npm run package` - Package the application for distribution
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm test` - Run tests

### Project Structure

```
src/
├── main/           # Electron main process
├── renderer/       # React frontend
├── constants/      # App constants and configurations
└── types/          # TypeScript type definitions
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Joy** - [LinkedIn](https://www.linkedin.com/in/joy-nk/)
- **Udo** - [LinkedIn](https://www.linkedin.com/in/thisisudo/)

## 🆘 Troubleshooting

### Common Issues

**Ollama not found:**

- Ensure Ollama is installed and running
- Check that the required models are pulled

**Build errors:**

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Ensure you're using the correct Node.js version

**Electron build issues:**

- On macOS, you may need to install Xcode Command Line Tools
- On Windows, ensure you have Visual Studio Build Tools

**Offline usage:**

- Once models are downloaded, the app works completely offline
- No internet connection required for question generation or document processing
- All data is stored locally on your device

---

Built with ❤️ for educators everywhere.
