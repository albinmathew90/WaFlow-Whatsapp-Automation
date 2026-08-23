import { useState, useEffect } from 'react';
import type { FlowTrigger } from '../types/flow.types';

const getToken = () => sessionStorage.getItem('crm_token');
const headers = () => ({ Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' });

interface Props {
  flowId?: string;
  trigger: FlowTrigger;
  onChange: (trigger: FlowTrigger) => void;
}

export default function WebhookTriggerFields({ flowId, trigger, onChange }: Props) {
  const [keywordInput, setKeywordInput] = useState('');
  const [webhookToken, setWebhookToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string>('YOUR_ACCOUNT_ID');
  const [detectedFields, setDetectedFields] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Test Event state
  const [testPayload, setTestPayload] = useState('{\n  "event": "' + (trigger.triggerEventNames?.[0] || 'order.placed') + '",\n  "customer": {\n    "name": "John Doe",\n    "phone": "1234567890"\n  }\n}');
  const [detecting, setDetecting] = useState(false);
  const [detectSuccess, setDetectSuccess] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [snippetTab, setSnippetTab] = useState<'node' | 'curl' | 'php' | 'python' | 'go'>('node');
  const [showSnippets, setShowSnippets] = useState(true);
  const [copiedState, setCopiedState] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(id);
    setTimeout(() => setCopiedState(null), 2000);
  };

  useEffect(() => {
    if (trigger.triggerEventNames?.length && testPayload.includes('"event": "order.placed"')) {
      const firstEvent = trigger.triggerEventNames[0];
      setTestPayload(testPayload.replace('"event": "order.placed"', `"event": "${firstEvent}"`));
    }
  }, [trigger.triggerEventNames]);

  useEffect(() => {
    if (flowId && trigger.event === 'webhook') {
      fetch(`/openwa-api/crm/flows/${flowId}/trigger`, { headers: headers() })
        .then(res => res.json())
        .then(data => {
          if (data.webhookToken) setWebhookToken(data.webhookToken);
          if (data.accountId) setAccountId(data.accountId);
          if (data.detectedFields) setDetectedFields(data.detectedFields);
        })
        .catch(console.error);
    }
  }, [flowId, trigger.event]);

  const addEventName = (k: string) => {
    const words = k.split(',').map(w => w.trim()).filter(Boolean);
    if (!words.length) return;
    const current = trigger.triggerEventNames || [];
    const newNames = [...current];
    words.forEach(word => {
      if (!newNames.includes(word)) newNames.push(word);
    });
    if (newNames.length !== current.length) {
      onChange({ ...trigger, triggerEventNames: newNames });
    }
  };

  const removeEventName = (idx: number) => {
    const current = trigger.triggerEventNames || [];
    onChange({ ...trigger, triggerEventNames: current.filter((_: string, i: number) => i !== idx) });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEventName(keywordInput);
      setKeywordInput('');
    }
  };

  const handleBlur = () => {
    if (keywordInput.trim()) {
      addEventName(keywordInput);
      setKeywordInput('');
    }
  };

  const handleSaveTrigger = async () => {
    if (!flowId) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/openwa-api/crm/flows/${flowId}/trigger`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({
          trigger_type: 'webhook',
          trigger_event_names: trigger.triggerEventNames || []
        })
      });
      const data = await res.json();
      if (data.webhookToken) {
        setWebhookToken(data.webhookToken);
      }
      if (data.accountId) {
        setAccountId(data.accountId);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDetectFields = async () => {
    if (!flowId) return;
    setTestError(null);
    let parsed;
    try {
      parsed = JSON.parse(testPayload);
    } catch (e) {
      setTestError('Invalid JSON format. Please ensure all quotes are closed and format is valid.');
      return;
    }
    
    if (!parsed.event) {
      setTestError('Payload must include an "event" field matching one of your event names.');
      return;
    }

    setDetecting(true);
    try {
      const res = await fetch(`/openwa-api/crm/flows/${flowId}/webhook/test`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          event: parsed.event,
          sample_payload: parsed
        })
      });
      const data = await res.json();
      setDetectedFields(data);
      setDetectSuccess(true);
      setTimeout(() => setDetectSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setDetecting(false);
    }
  };

  // Construct Webhook URL
  const baseUrl = window.location.origin;
  const webhookUrl = webhookToken ? `${baseUrl}/openwa-api/crm/flows/webhooks/${accountId}/${webhookToken}` : '';

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Event Names</label>
        <div className="flex flex-wrap gap-1.5 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:bg-gray-800 min-h-[42px]">
          {(trigger.triggerEventNames || []).map((k: string, i: number) => (
            <div key={i} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 dark:bg-gray-700 px-2.5 py-1 rounded-md">
              <span className="text-[12px] text-gray-700 dark:text-gray-300 dark:text-gray-200">{k}</span>
              <button onClick={() => removeEventName(i)} className="text-gray-400 hover:text-red-500">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <input
            className="flex-1 min-w-[100px] text-[13px] bg-transparent outline-none text-gray-800 dark:text-gray-200 px-1"
            placeholder={!(trigger.triggerEventNames?.length) ? "e.g. order.placed" : ""}
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          />
        </div>
        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
          Type an event name and press Enter. Flow runs if the payload's event field matches any of these.
        </p>
      </div>

      <div className="pt-1">
        {!flowId && (
          <p className="text-[10.5px] text-orange-500 mb-2 font-medium bg-orange-50 dark:bg-orange-900/20 p-1.5 rounded border border-orange-100 dark:border-orange-800/50 leading-tight">
            ⚠️ Please save the flow using the main <b>Save</b> button (top right) first to enable webhook generation.
          </p>
        )}
        <button
          onClick={handleSaveTrigger}
          disabled={saving || !trigger.triggerEventNames?.length || !flowId}
          className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-[12px] font-medium rounded disabled:opacity-50 transition flex items-center gap-1.5 w-max"
          title={!flowId ? "Please save the flow first" : ""}
        >
          {saving ? 'Saving...' : 'Generate Webhook URL'}
          {saved && <span className="text-green-300 ml-1">✓</span>}
        </button>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-gray-100 dark:border-gray-800 pt-3">
        <div className="flex justify-between items-center">
          <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Webhook URL</label>
        </div>
        <div className="flex gap-2">
          <input
            readOnly
            className="flex-1 text-[12px] px-2 py-1.5 rounded bg-gray-50 dark:bg-gray-800 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
            value={webhookToken ? webhookUrl : 'Click Save to generate a URL.'}
          />
          {webhookToken && (
            <button
              onClick={() => handleCopy(webhookUrl, 'url')}
              className="px-2 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-700 text-[12px] min-w-[55px] text-center"
            >
              {copiedState === 'url' ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-gray-100 dark:border-gray-800 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:bg-gray-800 px-1.5 py-0.5 -ml-1.5 rounded transition" onClick={() => setShowSnippets(!showSnippets)}>
            <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 cursor-pointer">Snippets</label>
            <svg 
              className={`w-3 h-3 text-gray-400 transition-transform ${showSnippets ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {showSnippets && webhookToken && trigger.triggerEventNames?.length ? (
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setSnippetTab('node')} 
                className={`px-2 py-0.5 text-[9px] font-medium rounded-md transition-colors shadow-sm ${snippetTab === 'node' ? 'bg-white dark:bg-gray-900 dark:bg-gray-700 text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 shadow-none'}`}
              >
                Node.js
              </button>
              <button 
                onClick={() => setSnippetTab('curl')} 
                className={`px-2 py-0.5 text-[9px] font-medium rounded-md transition-colors shadow-sm ${snippetTab === 'curl' ? 'bg-white dark:bg-gray-900 dark:bg-gray-700 text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 shadow-none'}`}
              >
                cURL
              </button>
              <button 
                onClick={() => setSnippetTab('php')} 
                className={`px-2 py-0.5 text-[9px] font-medium rounded-md transition-colors shadow-sm ${snippetTab === 'php' ? 'bg-white dark:bg-gray-900 dark:bg-gray-700 text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 shadow-none'}`}
              >
                PHP
              </button>
              <button 
                onClick={() => setSnippetTab('python')} 
                className={`px-2 py-0.5 text-[9px] font-medium rounded-md transition-colors shadow-sm ${snippetTab === 'python' ? 'bg-white dark:bg-gray-900 dark:bg-gray-700 text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 shadow-none'}`}
              >
                Python
              </button>
              <button 
                onClick={() => setSnippetTab('go')} 
                className={`px-2 py-0.5 text-[9px] font-medium rounded-md transition-colors shadow-sm ${snippetTab === 'go' ? 'bg-white dark:bg-gray-900 dark:bg-gray-700 text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 shadow-none'}`}
              >
                Go
              </button>
            </div>
          ) : null}
        </div>
        
        {showSnippets && (
          <div className="mt-1">
            {webhookToken && trigger.triggerEventNames?.length ? (
              trigger.triggerEventNames.map((eventName: string) => (
                <div key={eventName} className="mb-2 bg-gray-50 dark:bg-gray-800 dark:bg-gray-900/50 rounded-lg p-2 border border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">Event: {eventName}</span>
                  
                  {snippetTab === 'curl' && (
                    <div className="relative group">
                      <pre className="text-[10px] bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
{`curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"event": "${eventName}", "customer": {"name": "John Doe", "phone": "1234567890"}${detectedFields[eventName] && detectedFields[eventName].length > 0 ? ', "example_field": "value"' : ''}}'`}
                      </pre>
                      <button
                        onClick={() => handleCopy(`curl -X POST ${webhookUrl} -H "Content-Type: application/json" -d '{"event": "${eventName}", "customer": {"name": "John Doe", "phone": "1234567890"}}'`, `curl-${eventName}`)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-[10px] transition shadow-sm border border-gray-600"
                      >{copiedState === `curl-${eventName}` ? 'Copied!' : 'Copy'}</button>
                    </div>
                  )}

                  {snippetTab === 'node' && (
                    <div className="relative group">
                      <pre className="text-[10px] bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
{`fetch("${webhookUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    event: "${eventName}",
    customer: { name: "John Doe", phone: "1234567890" }${
      detectedFields[eventName] && detectedFields[eventName].length > 0
        ? ',\n    // fields:\n    // ' + detectedFields[eventName].join(', ')
        : ''
    }
  })
})`}
                      </pre>
                      <button
                        onClick={() => handleCopy(`fetch("${webhookUrl}", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "${eventName}", customer: { name: "John Doe", phone: "1234567890" } }) })`, `node-${eventName}`)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-[10px] transition shadow-sm border border-gray-600"
                      >{copiedState === `node-${eventName}` ? 'Copied!' : 'Copy'}</button>
                    </div>
                  )}

                  {snippetTab === 'php' && (
                    <div className="relative group">
                      <pre className="text-[10px] bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
{`$ch = curl_init("${webhookUrl}");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  "event" => "${eventName}",
  "customer" => ["name" => "John Doe", "phone" => "1234567890"]${detectedFields[eventName] && detectedFields[eventName].length > 0 ? ",\n  // fields:\n  // " + detectedFields[eventName].join(", ") : ''}
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
$response = curl_exec($ch);
curl_close($ch);`}
                      </pre>
                      <button
                        onClick={() => handleCopy(`$ch = curl_init("${webhookUrl}");\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(["event" => "${eventName}", "customer" => ["name" => "John Doe", "phone" => "1234567890"]]));\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);\ncurl_exec($ch);\ncurl_close($ch);`, `php-${eventName}`)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-[10px] transition shadow-sm border border-gray-600"
                      >{copiedState === `php-${eventName}` ? 'Copied!' : 'Copy'}</button>
                    </div>
                  )}

                  {snippetTab === 'python' && (
                    <div className="relative group">
                      <pre className="text-[10px] bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
{`import requests
requests.post("${webhookUrl}", json={
  "event": "${eventName}",
  "customer": {"name": "John Doe", "phone": "1234567890"}${detectedFields[eventName] && detectedFields[eventName].length > 0 ? ",\n  # fields:\n  # " + detectedFields[eventName].join(", ") : ''}
})`}
                      </pre>
                      <button
                        onClick={() => handleCopy(`import requests\nrequests.post("${webhookUrl}", json={"event": "${eventName}", "customer": {"name": "John Doe", "phone": "1234567890"}} )`, `python-${eventName}`)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-[10px] transition shadow-sm border border-gray-600"
                      >{copiedState === `python-${eventName}` ? 'Copied!' : 'Copy'}</button>
                    </div>
                  )}

                  {snippetTab === 'go' && (
                    <div className="relative group">
                      <pre className="text-[10px] bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
{`package main
import (
  "bytes"
  "net/http"
)
func main() {
  payload := []byte(\`{"event": "${eventName}", "customer": {"name": "John Doe", "phone": "1234567890"}}\`)
  http.Post("${webhookUrl}", "application/json", bytes.NewBuffer(payload))
}`}
                      </pre>
                      <button
                        onClick={() => handleCopy(`package main\nimport (\n  "bytes"\n  "net/http"\n)\nfunc main() {\n  payload := []byte(\`{"event": "${eventName}", "customer": {"name": "John Doe", "phone": "1234567890"}}\`)\n  http.Post("${webhookUrl}", "application/json", bytes.NewBuffer(payload))\n}`, `go-${eventName}`)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-[10px] transition shadow-sm border border-gray-600"
                      >{copiedState === `go-${eventName}` ? 'Copied!' : 'Copy'}</button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-[10px] text-gray-400">Click Generate above to generate snippets.</p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5 border-t border-gray-100 dark:border-gray-800 pt-3">
        <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Send Test Event</label>
        {webhookToken ? (
          <div className="flex flex-col gap-2">
            <textarea
              className="w-full text-[11px] font-mono p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:bg-gray-900 outline-none"
              rows={5}
              value={testPayload}
              onChange={(e) => {
                setTestPayload(e.target.value);
                if (testError) setTestError(null);
              }}
            />
            {testError && (
              <div className="text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-2 rounded">
                ⚠ {testError}
              </div>
            )}
            <button
              onClick={handleDetectFields}
              disabled={detecting}
              className="w-full py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded text-[12px] font-medium"
            >
              {detecting ? 'Detecting...' : 'Detect Fields'}
            </button>
            {detectSuccess && !testError && (
              <div className="text-[11px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 p-2 rounded">
                ✓ Fields detected successfully. You can now use them in your Webhook Message node.
              </div>
            )}
          </div>
        ) : (
          <p className="text-[10px] text-gray-400">Generate URL first to test events.</p>
        )}
      </div>
    </>
  );
}
