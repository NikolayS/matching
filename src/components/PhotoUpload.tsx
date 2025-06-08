import React, { useState, useRef } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const UploadArea = styled.div<{ isDragOver: boolean; hasPhoto: boolean }>`
  width: 300px;
  height: 300px;
  border: 2px dashed ${props => 
    props.hasPhoto ? '#27ae60' : 
    props.isDragOver ? '#667eea' : '#e1e5e9'
  };
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => 
    props.hasPhoto ? '#f0fdf4' : 
    props.isDragOver ? '#f8f9ff' : '#f8f9ff'
  };
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: #667eea;
    background: #f8f9ff;
  }
`;

const PhotoPreview = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 14px;
`;

const UploadContent = styled.div`
  text-align: center;
  padding: 20px;
`;

const UploadIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.7;
`;

const UploadText = styled.div`
  color: #333;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const UploadSubtext = styled.div`
  color: #666;
  font-size: 14px;
  line-height: 1.4;
`;

const HiddenInput = styled.input`
  display: none;
`;

const ChangeButton = styled.button`
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.9);
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 14px;
  margin-top: 12px;
  text-align: center;
`;

const FileInfo = styled.div`
  margin-top: 16px;
  padding: 12px;
  background: #f8f9ff;
  border-radius: 8px;
  text-align: center;
  
  .filename {
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
  }
  
  .filesize {
    font-size: 12px;
    color: #666;
  }
`;

interface PhotoUploadProps {
  onPhotoSelect: (file: File) => void;
  error?: string;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({ onPhotoSelect, error }) => {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file';
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return 'File size must be less than 5MB';
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    onPhotoSelect(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleChangePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Container>
      <UploadArea
        isDragOver={dragOver}
        hasPhoto={!!preview}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {preview ? (
          <>
            <PhotoPreview src={preview} alt="Profile preview" />
            <ChangeButton onClick={handleChangePhoto}>
              Change Photo
            </ChangeButton>
          </>
        ) : (
          <UploadContent>
            <UploadIcon>📷</UploadIcon>
            <UploadText>Upload Your Photo</UploadText>
            <UploadSubtext>
              Drag and drop or click to browse<br/>
              JPG, PNG, GIF up to 5MB
            </UploadSubtext>
          </UploadContent>
        )}
      </UploadArea>

      <HiddenInput
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
      />

      {selectedFile && (
        <FileInfo>
          <div className="filename">{selectedFile.name}</div>
          <div className="filesize">{formatFileSize(selectedFile.size)}</div>
        </FileInfo>
      )}

      {(uploadError || error) && (
        <ErrorMessage>{uploadError || error}</ErrorMessage>
      )}
    </Container>
  );
}; 