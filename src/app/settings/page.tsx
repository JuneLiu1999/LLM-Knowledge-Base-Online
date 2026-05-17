'use client';

import { useState, useEffect } from 'react';

interface SettingField {
  key: string;
  label: string;
  placeholder: string;
  sensitive: boolean;
  group: string;
}

const SETTING_FIELDS: SettingField[] = [
  { key: 'cheap_model_base_url', label: 'Base URL', placeholder: 'https://api.deepseek.com/v1', sensitive: false, group: '便宜模型（Embedding / 简单任务）' },
  { key: 'cheap_model_api_key', label: 'API Key', placeholder: 'sk-...', sensitive: true, group: '便宜模型（Embedding / 简单任务）' },
  { key: 'cheap_model_name', label: '模型名称', placeholder: 'deepseek-chat', sensitive: false, group: '便宜模型（Embedding / 简单任务）' },
  { key: 'strong_model_base_url', label: 'Base URL', placeholder: 'https://api.deepseek.com/v1', sensitive: false, group: '强模型（分类 / 双链 / 日报）' },
  { key: 'strong_model_api_key', label: 'API Key', placeholder: 'sk-...', sensitive: true, group: '强模型（分类 / 双链 / 日报）' },
  { key: 'strong_model_name', label: '模型名称', placeholder: 'deepseek-chat', sensitive: false, group: '强模型（分类 / 双链 / 日报）' },
  { key: 'embedding_model_base_url', label: 'Base URL', placeholder: 'https://api.deepseek.com/v1', sensitive: false, group: 'Embedding 模型' },
  { key: 'embedding_model_api_key', label: 'API Key', placeholder: 'sk-...', sensitive: true, group: 'Embedding 模型' },
  { key: 'embedding_model_name', label: '模型名称', placeholder: 'deepseek-embedding', sensitive: false, group: 'Embedding 模型' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const resp = await fetch('/api/settings');
      const data = await resp.json();
      setSettings(data.settings || {});
    } catch {
      setMessage({ type: 'error', text: '加载设置失败' });
    } finally {
      setLoading(false);
    }
  }

  async function saveSetting(key: string, value: string) {
    setSaving(true);
    setMessage(null);
    try {
      const resp = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      const data = await resp.json();
      if (data.success) {
        setMessage({ type: 'success', text: '已保存' });
        setEditingKey(null);
        setEditValue('');
        loadSettings();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch {
      setMessage({ type: 'error', text: '保存失败' });
    } finally {
      setSaving(false);
    }
  }

  function startEdit(key: string, sensitive: boolean) {
    setEditingKey(key);
    setEditValue(sensitive ? '' : (settings[key] || ''));
    setMessage(null);
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditValue('');
  }

  if (loading) return <div className="text-gray-400 py-8 text-center">加载中...</div>;

  const groups = Array.from(new Set(SETTING_FIELDS.map(f => f.group)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">设置</h1>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>安全说明</strong>：API Key 使用 AES-256-GCM 加密后存储在数据库中。页面上只显示掩码值（如 sk-****abcd），修改时需要重新输入完整的 Key。
      </div>

      {groups.map(group => (
        <section key={group} className="bg-gray-50 rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4">{group}</h2>
          <div className="space-y-3">
            {SETTING_FIELDS.filter(f => f.group === group).map(field => (
              <div key={field.key} className="flex items-center gap-3">
                <label className="w-24 text-sm text-gray-600 flex-shrink-0">{field.label}</label>

                {editingKey === field.key ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type={field.sensitive ? 'password' : 'text'}
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      placeholder={field.sensitive ? '输入新的 API Key' : field.placeholder}
                      className="flex-1 px-3 py-1.5 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter' && editValue.trim()) saveSetting(field.key, editValue.trim());
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <button
                      onClick={() => editValue.trim() && saveSetting(field.key, editValue.trim())}
                      disabled={saving || !editValue.trim()}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? '...' : '保存'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center gap-2">
                    <span className={`flex-1 px-3 py-1.5 rounded-lg text-sm ${
                      settings[field.key] ? 'bg-white border border-gray-200' : 'bg-white border border-gray-200 text-gray-400'
                    }`}>
                      {settings[field.key] || (field.sensitive ? '未设置' : field.placeholder)}
                    </span>
                    <button
                      onClick={() => startEdit(field.key, field.sensitive)}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 whitespace-nowrap"
                    >
                      {settings[field.key] ? '修改' : '设置'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="bg-gray-50 rounded-xl p-5 text-sm text-gray-500">
        <h3 className="font-medium text-gray-700 mb-2">支持的模型服务</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Deepseek</strong>: https://api.deepseek.com/v1</li>
          <li><strong>Kimi (Moonshot)</strong>: https://api.moonshot.cn/v1</li>
          <li><strong>MiMO</strong>: 参考官方文档获取 Base URL</li>
          <li>任何兼容 OpenAI API 协议的服务均可使用</li>
        </ul>
      </section>
    </div>
  );
}
