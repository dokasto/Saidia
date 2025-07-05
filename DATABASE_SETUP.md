# Database Setup Guide

This guide explains how to use the SQLite database with sqlite-vec for vector embeddings in your Electron app.

## Overview

The database setup includes:

- **Sequelize ORM** for easy database operations
- **sqlite-vec** for vector embeddings and similarity search
- **Better-sqlite3** as the underlying SQLite driver
- **IPC handlers** for communication between main and renderer processes

## Database Schema

The database contains the following tables:

### 1. Subjects

```sql
CREATE TABLE subjects (
    subject_id   TEXT PRIMARY KEY,
    name         TEXT
);
```

### 2. Files

```sql
CREATE TABLE files (
    file_id      TEXT PRIMARY KEY,
    subject_id   TEXT NOT NULL REFERENCES subjects(subject_id),
    filename     TEXT,
    filepath     TEXT
);
```

### 3. Questions

```sql
CREATE TABLE questions (
    question_id    TEXT PRIMARY KEY,
    subject_id     TEXT NOT NULL REFERENCES subjects(subject_id),
    difficulty     TEXT,
    content        TEXT,
    options_json   TEXT,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Tags

```sql
CREATE TABLE tags (
    tag_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT UNIQUE
);
```

### 5. Question Tags (Junction Table)

```sql
CREATE TABLE question_tags (
    question_id  TEXT REFERENCES questions(question_id),
    tag_id       INTEGER REFERENCES tags(tag_id),
    PRIMARY KEY (question_id, tag_id)
);
```

### 6. Embeddings (Virtual Table)

```sql
CREATE VIRTUAL TABLE embeddings USING vec0 (
    chunk_id     TEXT PRIMARY KEY,
    subject_id   TEXT,
    file_id      TEXT,
    chunk_index  INTEGER,
    text         TEXT,
    embedding    FLOAT[384]
);
```

## Usage Examples

### From React Components

```tsx
import React, { useState, useEffect } from 'react';
import { useDatabase } from '../hooks/useDatabase';

const MyComponent = () => {
  const db = useDatabase();
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    const result = await db.getSubjects();
    if (result.success) {
      setSubjects(result.data);
    } else {
      console.error('Error loading subjects:', result.error);
    }
  };

  const createSubject = async () => {
    const result = await db.createSubject('math_101', 'Mathematics 101');
    if (result.success) {
      console.log('Subject created:', result.data);
      loadSubjects(); // Refresh the list
    }
  };

  return (
    <div>
      <button onClick={createSubject}>Create Subject</button>
      <ul>
        {subjects.map((subject) => (
          <li key={subject.subject_id}>{subject.name}</li>
        ))}
      </ul>
    </div>
  );
};
```

### Vector Search Example

```tsx
const VectorSearchExample = () => {
  const db = useDatabase();

  const performVectorSearch = async () => {
    // Example: Create a query embedding (normally from an embedding model)
    const queryEmbedding = new Array(384).fill(0).map(() => Math.random());

    // Search for similar embeddings
    const result = await db.searchSimilar(queryEmbedding, 10, 'math_101');

    if (result.success) {
      console.log('Similar chunks found:', result.data);
    }
  };

  const addEmbedding = async () => {
    const embedding = new Array(384).fill(0).map(() => Math.random());

    const result = await db.addEmbedding(
      'chunk_001',
      'math_101',
      'algebra_basics.pdf',
      0,
      'This is a sample text about algebra basics.',
      embedding,
    );

    if (result.success) {
      console.log('Embedding added successfully');
    }
  };

  return (
    <div>
      <button onClick={addEmbedding}>Add Sample Embedding</button>
      <button onClick={performVectorSearch}>Search Similar</button>
    </div>
  );
};
```

### Working with Questions and Tags

```tsx
const QuestionManager = () => {
  const db = useDatabase();

  const createQuestionWithTags = async () => {
    // Create a question
    const questionResult = await db.createQuestion(
      'q_001',
      'math_101',
      'medium',
      'What is 2 + 2?',
      JSON.stringify(['2', '3', '4', '5']),
      ['arithmetic', 'addition'],
    );

    if (questionResult.success) {
      console.log('Question created with tags');
    }
  };

  const getQuestionsByDifficulty = async () => {
    const result = await db.getQuestions('math_101', 'medium');
    if (result.success) {
      console.log('Medium questions:', result.data);
    }
  };

  return (
    <div>
      <button onClick={createQuestionWithTags}>
        Create Question with Tags
      </button>
      <button onClick={getQuestionsByDifficulty}>Get Medium Questions</button>
    </div>
  );
};
```

## Available Database Operations

### Subject Operations

- `createSubject(subject_id, name)`
- `getSubjects()`
- `getSubject(subject_id)`
- `updateSubject(subject_id, updates)`
- `deleteSubject(subject_id)`

### File Operations

- `createFile(file_id, subject_id, filename, filepath)`
- `getFiles(subject_id?)`
- `getFile(file_id)`
- `updateFile(file_id, updates)`
- `deleteFile(file_id)`

### Question Operations

- `createQuestion(question_id, subject_id, difficulty, content, options_json, tags?)`
- `getQuestions(subject_id?, difficulty?)`
- `getQuestion(question_id)`
- `updateQuestion(question_id, updates)`
- `deleteQuestion(question_id)`

### Tag Operations

- `createTag(name)`
- `getTags()`
- `addTagsToQuestion(question_id, tagNames)`
- `removeTagFromQuestion(question_id, tag_id)`

### Embedding Operations

- `addEmbedding(chunk_id, subject_id, file_id, chunk_index, text, embedding)`
- `searchSimilar(queryEmbedding, limit?, subject_id?)`
- `getEmbeddingsByFile(file_id)`
- `getEmbeddingsBySubject(subject_id)`
- `getEmbeddingsCount(subject_id?)`
- `getVectorDbVersion()`

## Error Handling

All database operations return a response object with this structure:

```typescript
interface DbResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
```

Always check the `success` property before using the data:

```tsx
const result = await db.getSubjects();
if (result.success) {
  // Use result.data
  setSubjects(result.data);
} else {
  // Handle error
  console.error('Database error:', result.error);
}
```

## Database Location

The database file is stored in:

- **Development**: `./data.db` (project root)
- **Production**: `{userData}/data.db` (user's app data directory)

## File Storage System

### **How File Storage Works in Electron**

Files are stored persistently using Electron's `app.getPath('userData')` directory:

- **Storage Location**: `{userData}/files/`
- **Organization**: Files are organized by subject ID in subdirectories
- **Persistence**: Files persist across app restarts and updates
- **Security**: File operations are handled in the main process for security

### **File Storage Structure**

```
{userData}/
├── data.db                    # SQLite database
└── files/                     # File storage directory
    ├── subject_001/           # Subject-specific folder
    │   ├── document_1234.pdf  # Stored files with unique names
    │   └── image_5678.jpg
    └── subject_002/
        └── notes_9012.txt
```

### **File Upload Process**

1. **User selects file** in the renderer process
2. **File path is sent** to main process via IPC
3. **FileManager copies file** to app storage directory
4. **Database record created** with relative path
5. **Original file reference** is maintained in database

### **File Management Features**

- ✅ **Automatic organization** by subject
- ✅ **Unique filename generation** to prevent conflicts
- ✅ **File size tracking** and reporting
- ✅ **Automatic cleanup** when subjects/files are deleted
- ✅ **Path resolution** for accessing stored files
- ✅ **File existence checking** and validation

## Vector Embeddings

The `embeddings` table uses sqlite-vec's `vec0` virtual table for efficient vector storage and similarity search. Each embedding should be a 384-dimensional float array (adjust size as needed for your embedding model).

### Example with Real Embedding Model

```tsx
// Example using a hypothetical embedding service
const generateEmbedding = async (text: string): Promise<number[]> => {
  // This would call your embedding model (OpenAI, Sentence Transformers, etc.)
  const response = await fetch('/api/embed', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  return response.json();
};

const addTextChunk = async (
  text: string,
  subject_id: string,
  file_id: string,
) => {
  const embedding = await generateEmbedding(text);
  const chunk_id = `${file_id}_chunk_${Date.now()}`;

  const result = await db.addEmbedding(
    chunk_id,
    subject_id,
    file_id,
    0,
    text,
    embedding,
  );

  return result;
};
```

## Testing the Setup

Use the `DatabaseDemo` component to test all functionality:

```tsx
import { DatabaseDemo } from './components/DatabaseDemo';

// Add to your App.tsx
<DatabaseDemo />;
```

This component provides a UI to:

- Create and manage subjects
- Test vector search functionality
- View database statistics
- Check sqlite-vec version
