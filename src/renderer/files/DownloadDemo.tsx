import React, { useState, useEffect } from 'react';
import { useFiles } from './useFiles';

interface DownloadedFile {
  filename: string;
  filePath: string;
  size: number;
  createdAt: Date;
  folderName?: string;
}

export const DownloadDemo: React.FC = () => {
  const {
    downloadFiles,
    getDownloadedFiles,
    deleteDownloadedFile,
    getDownloadsPath,
    downloadProgress,
  } = useFiles();

  const [urls, setUrls] = useState('');
  const [folderName, setFolderName] = useState('');
  const [downloadedFiles, setDownloadedFiles] = useState<DownloadedFile[]>([]);
  const [downloadsPath, setDownloadsPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadDownloadedFiles();
    loadDownloadsPath();
  }, []);

  const loadDownloadedFiles = async () => {
    try {
      const result = await getDownloadedFiles();
      if (result.success) {
        setDownloadedFiles(result.data || []);
      } else {
        setError(`Failed to load downloaded files: ${result.error}`);
      }
    } catch (err) {
      setError(`Error loading downloaded files: ${(err as Error).message}`);
    }
  };

  const loadDownloadsPath = async () => {
    try {
      const result = await getDownloadsPath();
      if (result.success) {
        setDownloadsPath(result.data || '');
      }
    } catch (err) {
      console.error('Error loading downloads path:', err);
    }
  };

  const handleDownload = async () => {
    if (!urls.trim()) {
      setError('Please enter at least one URL');
      return;
    }

    const urlList = urls
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u);

    if (urlList.length === 0) {
      setError('Please enter at least one valid URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await downloadFiles(
        urlList,
        folderName.trim() || undefined,
      );

      if (result.success) {
        setUrls('');
        setFolderName('');
        await loadDownloadedFiles(); // Reload the list

        const successCount = result.data.filter((r: any) => r.success).length;
        const totalCount = result.data.length;
        const folderInfo = folderName.trim()
          ? ` to folder "${folderName.trim()}"`
          : '';
        alert(
          `${successCount}/${totalCount} files downloaded successfully${folderInfo}!`,
        );
      } else {
        setError(`Download failed: ${result.error}`);
      }
    } catch (err) {
      setError(`Error downloading files: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (filename: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const result = await deleteDownloadedFile(filename);

      if (result.success) {
        await loadDownloadedFiles(); // Reload the list
      } else {
        setError(`Failed to delete file: ${result.error}`);
      }
    } catch (err) {
      setError(`Error deleting file: ${(err as Error).message}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>File Download Demo</h2>

      {downloadsPath && (
        <p style={{ color: '#666', fontSize: '14px' }}>
          Downloads stored in: <code>{downloadsPath}</code>
        </p>
      )}

      {/* Download Form */}
      <div
        style={{
          marginBottom: '30px',
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
        }}
      >
        <h3>Download Files</h3>
        <div style={{ marginBottom: '10px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
            }}
          >
            Folder Name (optional):
          </label>
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="e.g., documents, images, projects (leave empty for root downloads folder)"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px',
              marginBottom: '10px',
            }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
            }}
          >
            URLs to Download:
          </label>
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder="Enter URLs (one per line):&#10;https://example.com/file1.pdf&#10;https://example.com/file2.jpg&#10;https://example.com/file3.zip"
            style={{
              width: '100%',
              height: '100px',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button
            onClick={handleDownload}
            disabled={loading || !urls.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading
              ? 'Downloading...'
              : `Download ${urls.split('\n').filter((u) => u.trim()).length} Files`}
          </button>
        </div>

        {/* Download Progress */}
        {downloadProgress.size > 0 && (
          <div style={{ marginTop: '15px' }}>
            <h4>Download Progress:</h4>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              {Array.from(downloadProgress.values()).map((progress) => (
                <div
                  key={progress.downloadId}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '5px',
                      fontSize: '12px',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 'bold',
                        color:
                          progress.status === 'completed'
                            ? '#28a745'
                            : progress.status === 'error'
                              ? '#dc3545'
                              : '#007bff',
                      }}
                    >
                      {progress.status === 'starting'
                        ? 'Starting...'
                        : progress.status === 'downloading'
                          ? 'Downloading...'
                          : progress.status === 'completed'
                            ? 'Completed'
                            : 'Error'}
                    </span>
                    <span>{progress.percentage}%</span>
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#666',
                      marginBottom: '5px',
                      wordBreak: 'break-all',
                    }}
                  >
                    {progress.url}
                  </div>
                  {progress.status === 'downloading' && (
                    <div
                      style={{
                        width: '100%',
                        height: '15px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '8px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${progress.percentage}%`,
                          height: '100%',
                          backgroundColor: '#007bff',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  )}
                  {progress.status === 'downloading' && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#666',
                        marginTop: '3px',
                      }}
                    >
                      {formatFileSize(progress.downloaded)} /{' '}
                      {formatFileSize(progress.total)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ color: 'red', marginTop: '10px' }}>Error: {error}</div>
        )}
      </div>

      {/* Downloaded Files List */}
      <div>
        <h3>Downloaded Files ({downloadedFiles.length})</h3>
        {downloadedFiles.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            No files downloaded yet.
          </p>
        ) : (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            {downloadedFiles.map((file) => (
              <div
                key={file.filename}
                style={{
                  padding: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {file.filename}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {file.folderName && (
                      <span style={{ marginRight: '10px' }}>
                        📁 {file.folderName}
                      </span>
                    )}
                    Size: {formatFileSize(file.size)} | Downloaded:{' '}
                    {formatDate(file.createdAt)}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteFile(file.filename)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
