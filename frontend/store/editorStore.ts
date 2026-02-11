import { create } from 'zustand';


export type Language = 'python' | 'java' | 'cpp' | 'javascript' | 'c' | 'go';

interface EditorState {
  code: string;
  language: Language;
  output: string;
  error: string;
  executionTime: string;
  memory: string;
  customInput: string;
  isRunning: boolean;
  currentSnippetId: string | null;
  setCode: (code: string) => void;
  setLanguage: (language: Language) => void;
  setOutput: (output: string) => void;
  setError: (error: string) => void;
  setExecutionTime: (time: string) => void;
  setMemory: (memory: string) => void;
  setCustomInput: (input: string) => void;
  setIsRunning: (isRunning: boolean) => void;
  setCurrentSnippetId: (id: string | null) => void;
  clearOutput: () => void;
  resetEditor: () => void;
}

const getDefaultCode = (language: Language): string => {
  const templates: Record<Language, string> = {
    python: `# Python Code
def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()`,
    java: `// Java Code
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
    cpp: `// C++ Code
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
    javascript: `// JavaScript Code
function main() {
    console.log("Hello, World!");
}

main();`,
    c: `// C Code
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
    go: `// Go Code
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,
  };

  return templates[language];
};

export const useEditorStore = create<EditorState>((set) => ({
  code: getDefaultCode('python'),
  language: 'python',
  output: '',
  error: '',
  executionTime: '',
  memory: '',
  customInput: '',
  isRunning: false,
  currentSnippetId: null,

  setCode: (code) => set({ code }),

  setLanguage: (language) =>
    set((state) => ({
      language,
      code: state.currentSnippetId ? state.code : getDefaultCode(language),
    })),

  setOutput: (output) => set({ output }),
  setError: (error) => set({ error }),
  setExecutionTime: (executionTime) => set({ executionTime }),
  setMemory: (memory) => set({ memory }),
  setCustomInput: (customInput) => set({ customInput }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setCurrentSnippetId: (currentSnippetId) => set({ currentSnippetId }),

  clearOutput: () =>
    set({
      output: '',
      error: '',
      executionTime: '',
      memory: '',
    }),

  resetEditor: () =>
    set((state) => ({
      code: getDefaultCode(state.language),
      output: '',
      error: '',
      executionTime: '',
      memory: '',
      customInput: '',
      currentSnippetId: null,
    })),
}));
