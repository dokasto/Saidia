# Saidia: Technical Writeup

## Summary

Many regions across Africa face significant challenges with unreliable internet connectivity and inconsistent power supply. In these environments, a laptop with a tool like Saidia becomes a powerful solution for empowering educators with AI capabilities. By operating entirely offline and requiring only basic hardware, Saidia makes advanced AI technology accessible to teachers in communities where traditional cloud-based solutions are impractical or impossible.

Built as an Electron desktop application, it leverages local AI models to generate educational questions from uploaded documents, enabling teachers to create assessments without requiring internet access.

## Architecture Overview

### Core Architecture

Saidia follows a modern Electron architecture with clear separation between main and renderer processes:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Renderer      │    │     Main        │    │   Database      │
│   Process       │◄──►│   Process       │◄──►│   (SQLite)      │
│   (React/TSX)   │    │   (Node.js)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │   LLM Services  │    │   Vector Store  │
│   - Dashboard   │    │   - Ollama      │    │   - Embeddings  │
│   - File Upload │    │   - Gemma 3n    │    │   - Search      │
│   - Questions   │    │   - Generation  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components

1. **Main Process**: Handles file processing, LLM operations, and database management
2. **Renderer Process**: React-based UI for user interaction
3. **Database Layer**: SQLite with vector extensions for semantic search
4. **LLM Layer**: Ollama integration with Gemma 3n models
5. **File Processing**: Multi-format document parsing (PDF, DOCX, TXT, MD, ODT)

## Gemma 3n Integration

### Model Selection Strategy

We specifically chose Gemma 3n for its balance of performance and resource efficiency:

- **Primary Model**: `gemma3n:e4b-it-q4_K_M` (4B parameters, quantized)
- **Fallback Model**: `gemma3n:e2b-it-q4_K_M` (2B parameters, quantized)
- **Embedding Model**: `nomic-embed-text:v1.5` (768-dimensional embeddings)

### Why Gemma 3n?

1. **Resource Efficiency**: Quantized models require significantly less RAM and storage
2. **Local Operation**: No internet dependency, perfect for offline environments
3. **Educational Focus**: Gemma models excel at educational content generation
4. **Cross-Platform**: Consistent performance across Windows, macOS, and Linux

### Implementation Details

```typescript
// Dynamic model selection based on availability
static async recommendModelForQuestionGeneration(): Promise<string> {
  const models = await this.ollamaClient.list();
  return models.some(model => model.name.includes('gemma3n:e4b-it-fp16'))
    ? 'gemma3n:e4b-it-fp16'
    : 'gemma3n:e2b-it-q4_K_M';
}
```

### Prompt Engineering

We developed sophisticated prompt engineering to ensure consistent, high-quality question generation:

```typescript
// Structured output with Zod schema validation
const prompt = generatePromptAndSchema(subjectName, options, chunks);
const response = await LLMService.generate({
  model: await LLMService.recommendModelForQuestionGeneration(),
  prompt,
  format: zodToJsonSchema(zodSchema),
});
```

## Technical Challenges & Solutions

### 1. SQLite Vector Extension in Electron

**Challenge**: The `sqlite-vec` extension failed to load in packaged Electron applications due to path resolution issues and native binary compatibility.

**Solution**: Implemented a multi-layered fallback system:

```typescript
// Primary attempt: Direct loading
try {
  sqliteVec.load(this.vectorDbInstance);
} catch (error) {
  // Fallback: Manual extension loading with path resolution
  const extensionPath = path.join(
    app.getAppPath().replace('app.asar', 'app.asar.unpacked'),
    'node_modules/sqlite-vec/node_modules/sqlite-vec-darwin-arm64/vec0.dylib',
  );
  this.vectorDbInstance.loadExtension(extensionPath);
}
```

**Key Insights**:

- Electron's ASAR packaging requires special handling for native extensions
- Platform-specific binary paths need dynamic resolution
- Multiple fallback strategies ensure robustness

### 2. Ollama Integration & Packaging

**Challenge**: Ollama needed to be bundled with the application and work across different platforms without user installation.

**Solution**: Implemented a comprehensive download and installation system:

```typescript
// Platform-specific Ollama download URLs
const OLLAMA_DOWNLOAD_URLS = {
  MAC: 'https://github.com/ollama/ollama/releases/download/v0.9.5/Ollama.dmg',
  WINDOWS:
    'https://github.com/ollama/ollama/releases/download/v0.9.5/ollama-windows-amd64.zip',
  LINUX: {
    AMD64:
      'https://github.com/ollama/ollama/releases/download/v0.9.5/ollama-linux-amd64',
    ARM64:
      'https://github.com/ollama/ollama/releases/download/v0.9.5/ollama-linux-arm64',
  },
};
```

**Implementation Features**:

- Automatic platform detection and binary download
- Progress tracking for large model downloads
- Cross-platform executable management
- Automatic service startup and health monitoring

### 3. Windows Build Compatibility

**Challenge**: Building for Windows required handling different executable formats, path separators, and process management.

**Solution**: Platform-specific process management:

```typescript
// Windows-specific Ollama startup
private static async startOllamaOnWindows(): Promise<boolean> {
  const env = {
    ...process.env,
    OLLAMA_HOST: this.host,
    OLLAMA_MODELS: this.ollamaPath,
    PATH: `${path.dirname(ollamaExecutable)};${process.env.PATH || ''}`
  };

  this.ollamaProcess = spawn(ollamaExecutable, ['serve'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
    detached: false,
    windowsHide: true,
    cwd: path.dirname(ollamaExecutable)
  });
}
```

**Key Achievements**:

- Successfully packaged for Windows with NSIS installer
- Handled Windows-specific process management
- Resolved path and environment variable issues
- Ensured cross-platform compatibility

## Database Design

### Vector Database Integration

```sql
-- Virtual table for semantic search
CREATE VIRTUAL TABLE IF NOT EXISTS embeddings USING vec0(
  chunk_id TEXT PRIMARY KEY,
  subject_id TEXT,
  file_id TEXT,
  text TEXT,
  embedding float[768]
);
```

### Schema Design

- **Subjects**: Educational subject organization
- **Files**: Document metadata and content
- **Embeddings**: Vector representations for semantic search
- **Questions**: Generated assessment content

## File Processing Pipeline

### Multi-Format Support

The application supports multiple document formats through specialized parsers:

- **PDF**: Text extraction with layout preservation
- **DOCX**: Structured content extraction
- **TXT/MD**: Direct text processing
- **ODT**: OpenDocument format support

### Processing Flow

1. **Upload**: File validation and metadata extraction
2. **Parsing**: Format-specific content extraction
3. **Chunking**: Semantic text segmentation
4. **Embedding**: Vector generation using Nomic Embed
5. **Storage**: SQLite with vector search capabilities

## Performance Optimizations

### Memory Management

- **Model Quantization**: Using Q4_K_M quantization for 4x memory reduction
- **Streaming Downloads**: Progressive model download with progress tracking
- **Lazy Loading**: Models loaded only when needed

### Search Optimization

- **Vector Indexing**: Efficient similarity search using SQLite vector extensions
- **Caching**: Embedding cache for repeated queries
- **Batch Processing**: Efficient bulk operations

## Security Considerations

### Local-First Architecture

- **No Internet Dependency**: All processing happens locally
- **Data Privacy**: User documents never leave the device
- **Secure Storage**: SQLite database with proper access controls

### Input Validation

- **File Type Validation**: Strict MIME type checking
- **Content Sanitization**: Safe text processing
- **Prompt Injection Protection**: Structured input handling

## Deployment Strategy

### Cross-Platform Packaging

```json
{
  "build": {
    "mac": {
      "target": "default",
      "arch": ["arm64", "x64"]
    },
    "win": {
      "target": ["nsis"]
    },
    "linux": {
      "target": ["AppImage"]
    }
  }
}
```

### Distribution Considerations

- **Offline Installation**: Complete offline package with all dependencies
- **Auto-Updates**: Electron updater for future enhancements
- **Resource Management**: Efficient disk and memory usage

## Impact & Innovation

### Educational Technology Access

Saidia addresses a critical gap in educational technology by:

1. **Democratizing AI**: Bringing advanced AI capabilities to regions with poor connectivity
2. **Teacher Empowerment**: Enabling educators to create quality assessments without internet
3. **Scalable Solution**: Works on standard hardware without specialized infrastructure

### Technical Innovation

1. **Local AI Integration**: First-of-its-kind local AI integration in educational software
2. **Vector Search**: Advanced semantic search for educational content
3. **Cross-Platform Compatibility**: Seamless experience across operating systems

## Future Enhancements

### Planned Improvements

1. **Model Optimization**: Further quantization and optimization
2. **Multi-Language Support**: Localization for different regions
3. **Advanced Analytics**: Learning outcome tracking and analysis
4. **Collaborative Features**: Teacher collaboration tools

## Conclusion

Saidia represents a significant technical achievement in bringing AI-powered educational tools to underserved regions. The combination of local AI processing, robust cross-platform deployment, and thoughtful architecture makes it a scalable solution for educational technology access worldwide.

The technical challenges overcome, particularly the SQLite vector extension integration and cross-platform Ollama packaging—demonstrate the engineering depth required to create truly accessible AI applications. The choice of Gemma 3n models provides the perfect balance of performance and resource efficiency for offline operation.

This project proves that with careful engineering and thoughtful architecture, advanced AI capabilities can be made available to communities regardless of their internet connectivity, opening new possibilities for educational technology deployment in developing regions.
