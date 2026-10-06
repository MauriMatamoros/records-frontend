'use client';

import { Box, FileUpload, Icon, Text } from '@chakra-ui/react';
import { Upload } from 'lucide-react';

interface Props {
  onFile: (file: File | null) => void;
}

export function FilePicker({ onFile }: Props) {
  return (
    <FileUpload.Root
      accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      maxFiles={1}
      maxFileSize={20 * 1024 * 1024}
      alignItems="stretch"
      onFileChange={(details) => onFile(details.acceptedFiles[0] ?? null)}
    >
      <FileUpload.HiddenInput />
      <FileUpload.Dropzone minH="28" borderColor="rule" bg="canvas">
        <Icon size="md" color="inkMuted">
          <Upload />
        </Icon>
        <FileUpload.DropzoneContent>
          <Box fontWeight="500">Drop a spreadsheet here or click to choose</Box>
          <Text color="inkMuted" textStyle="sm">
            .csv or .xlsx (first sheet), up to 20 MB. The first row must be the column headers.
          </Text>
        </FileUpload.DropzoneContent>
      </FileUpload.Dropzone>
      <FileUpload.List clearable />
    </FileUpload.Root>
  );
}
