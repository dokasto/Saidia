import React from 'react';
import { Button, Modal, Stack, Text, Title } from '@mantine/core';
import { TQuestion } from '../../types';

type Props = {
  opened: boolean;
  onClose: () => void;
  questions: TQuestion[];
};

export default function PrintModal({ opened, onClose, questions }: Props) {
  const handlePrint = () => {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-1000px';
    printFrame.style.left = '-1000px';

    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
    <html>
      <head>
        <title>Print Questions</title>
        <style>
          body {
            font-family: sans-serif;
            padding: 20px;
          }
          h3 {
            margin-bottom: 8px;
          }
          .question {
            margin-bottom: 32px;
          }
          .option {
            margin-left: 20px;
            margin-bottom: 4px;
          }
        </style>
      </head>
      <body>
        ${questions
          .map(
            (q, index) => `
            <div class="question">
              <h3>${index + 1}. ${q.title}</h3>
              ${
                q.options?.length
                  ? q.options
                      .map(
                        (opt, i) =>
                          `<div class="option">${String.fromCharCode(
                            65 + i,
                          )}. ${opt}</div>`,
                      )
                      .join('')
                  : ''
              }
            </div>
          `,
          )
          .join('')}
      </body>
    </html>
  `);
    doc.close();

    printFrame.contentWindow?.focus();
    printFrame.contentWindow?.print();

    setTimeout(() => {
      document.body.removeChild(printFrame);
    }, 1000);

    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Print Selected Questions"
      size="lg"
    >
      <Stack gap="md">
        {questions.map((q, index) => (
          <div key={q.question_id} style={{ marginBottom: '2rem' }}>
            <Title order={5}>
              {index + 1}. {q.title}
            </Title>
            <Stack pl="md" mt="xs">
              {q.options?.length
                ? q.options.map((opt, i) => (
                    <Text key={i}>
                      {String.fromCharCode(65 + i)}. {opt}
                    </Text>
                  ))
                : null}
            </Stack>
          </div>
        ))}

        <Button mt="lg" color="black" onClick={handlePrint}>
          Print
        </Button>
      </Stack>
    </Modal>
  );
}
