import { useReducer, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CHATGPT_MAX_TOKENS = 1000;

async function getSelection(requestedTab?: chrome.tabs.Tab) {
  let tab = requestedTab;

  if (!requestedTab) {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    tab = activeTab;
  }

  if (!tab || !tab.id) return '';

  const result = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      return window.getSelection()?.toString();
    },
  });

  return result[0].result;
}

async function getOpenAIAPIKey() {
  const { openAIAPIKey } = await chrome.storage.local.get('openAIAPIKey');
  return openAIAPIKey;
}

function getPrompt(selection: string) {
  return `
    You are a developer and you are explaining some code to a colleague unfamiliar with the language.
    Explain the purpose of the code and how it could be utilized.
    You want to use the right terminology. You want to avoid jargon and buzzwords. 
    You want to avoid being patronizing. Describe the code in a way that a fellow developer would understand.
    You have ${CHATGPT_MAX_TOKENS} tokens to work with. Use markdown for formatting.
    Avoid long paragraphs and provide line breaks to make it easier to read.

    If the provided code does not appear to be code, you must respond with:
    Selection does not appear to be code.
 
    ## Code

    ${selection}
  `;
}

async function askChatGPT(prompt: string, openAIAPIKey: string) {
  const body = {
    model: 'text-davinci-003',
    temperature: 0,
    top_p: 1,
    presence_penalty: 0,
    frequency_penalty: 0,
    max_tokens: CHATGPT_MAX_TOKENS,
    prompt,
  };

  const response = await fetch('https://api.openai.com/v1/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + openAIAPIKey,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return data.choices[0].text.trim();
}

interface Config {
  openAIAPIKey: string;
}

type ConfigUpdate = {
  [Key in keyof Config]: { name: Key; value: Config[Key] };
}[keyof Config];

function configReducer(state: Config, action: ConfigUpdate) {
  return {
    ...state,
    [action.name]: action.value,
  };
}

function getConfigUpdate(event: React.ChangeEvent<HTMLInputElement>) {
  const { name, value } = event.target;

  switch (name) {
    case 'openAIAPIKey':
      return {
        name,
        value: value,
      };
    default:
      throw new Error(`Unhandled config field: ${name}`);
  }
}

function CogIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="text-gray-800" onClick={onClick}>
      <CogIcon />
    </button>
  );
}

function Settings({
  config,
  onChange,
}: {
  config: Config;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
}) {
  return (
    <div>
      <label>
        OpenAI API Key:{' '}
        <input
          type="password"
          name="openAIAPIKey"
          value={config.openAIAPIKey}
          onChange={onChange}
          className="border border-gray-300 focus:outline-gray-500 rounded p-1 w-56"
        />
      </label>
    </div>
  );
}

function LoadingIcon() {
  return (
    <svg
      aria-hidden="true"
      className="inline w-6 h-6 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
      viewBox="0 0 100 101"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
        fill="currentColor"
      />
      <path
        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
        fill="currentFill"
      />
    </svg>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center">
      <LoadingIcon />
      <span>Demystifying...</span>
    </div>
  );
}

function Demystifier({
  selection,
  openAIAPIKey,
}: {
  selection: string;
  openAIAPIKey: string;
}) {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selection || !openAIAPIKey) return;

    setLoading(true);
    const prompt = getPrompt(selection);

    (async () => {
      try {
        const response = await askChatGPT(prompt, openAIAPIKey);
        setExplanation(response);
      } catch (e) {
        setError('Request failed. Validate your OpenAI API key.');
      } finally {
        setLoading(false);
      }
    })();
  }, [selection, openAIAPIKey]);

  return (
    <div className="p-2 prose-sm">
      {(() => {
        switch (true) {
          case loading:
            return <Loading />;
          case Boolean(error):
            return error;
          case Boolean(explanation):
            return (
              <ReactMarkdown
                children={explanation}
                remarkPlugins={[remarkGfm]}
              />
            );
          default:
            return 'Select some code to demystify it.';
        }
      })()}
    </div>
  );
}

export default function Popup() {
  const [showSettings, toggleSettings] = useReducer((open) => !open, false);
  const [config, setConfig] = useReducer(configReducer, {
    openAIAPIKey: '',
  });

  const [selection, setSelection] = useState('');

  useEffect(() => {
    (async () => {
      const openAIAPIKey = await getOpenAIAPIKey();
      setConfig({ name: 'openAIAPIKey', value: openAIAPIKey });

      if (!openAIAPIKey) {
        toggleSettings();
      } else {
        const currentSelection = await getSelection();

        if (currentSelection) setSelection(currentSelection);
      }
    })();
  }, []);

  useEffect(() => {
    chrome.storage.local.set({ openAIAPIKey: config.openAIAPIKey });
  }, [config]);

  const handleConfigChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const configUpdate = getConfigUpdate(event);
    setConfig(configUpdate);
  };

  return (
    <div className="w-[30rem] p-4">
      <header className="min-w-full flex border-b pb-2 mb-3">
        <h1 className="text-xl flex-1 leading-6">Demystify code</h1>
        <SettingsButton onClick={toggleSettings} />
      </header>
      <main>
        {showSettings ? (
          <Settings config={config} onChange={handleConfigChange} />
        ) : (
          <Demystifier
            selection={selection}
            openAIAPIKey={config.openAIAPIKey}
          />
        )}
      </main>
    </div>
  );
}
