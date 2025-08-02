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

### Ideal Use Cases:

- **Rural Schools**: Where internet connectivity is unreliable
- **Remote Classrooms**: Areas with limited infrastructure
- **Budget-Conscious Institutions**: Avoiding cloud service costs
- **Privacy-Focused Environments**: Where data security is paramount

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
