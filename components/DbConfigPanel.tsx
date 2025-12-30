import React, { useState, useEffect } from 'react';
import { Database, Play, Check, X, AlertCircle, Server, RefreshCw, Settings, Save, Edit3 } from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:4000`;

interface DbConfig {
  server: string;
  database: string;
  user: string;
}

interface DbConfigForm {
  server: string;
  database: string;
  user: string;
  password: string;
}

interface SetupResult {
  file?: string;
  status: 'success' | 'error' | 'skipped';
  error?: string;
  reason?: string;
}

interface DbConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DbConfigPanel({ isOpen, onClose }: DbConfigPanelProps) {
  const [dbConfig, setDbConfig] = useState<DbConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [results, setResults] = useState<{ table: SetupResult[]; views: SetupResult[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<DbConfigForm>({
    server: '',
    database: '',
    user: '',
    password: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadDbConfig();
      testConnection();
    }
  }, [isOpen]);

  const loadDbConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/db-config`);
      if (response.ok) {
        const config = await response.json();
        setDbConfig(config);
        setFormData({
          server: config.server || '',
          database: config.database || '',
          user: config.user || '',
          password: '',
        });
      }
    } catch (err) {
      console.error('Error loading DB config:', err);
    }
  };

  const testConnection = async () => {
    setIsLoading(true);
    setConnectionStatus('unknown');
    try {
      const response = await fetch(`${API_BASE}/api/admin/test-connection`);
      const data = await response.json();
      setConnectionStatus(data.success ? 'connected' : 'error');
    } catch (err) {
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!formData.server || !formData.database || !formData.user || !formData.password) {
      setError('Tutti i campi sono obbligatori');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/db-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Errore nel salvataggio');
      }

      // Update local config display
      setDbConfig(data.config);
      setIsEditing(false);
      setConnectionStatus('connected');
      setFormData(prev => ({ ...prev, password: '' })); // Clear password
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      setConnectionStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setError(null);
    if (dbConfig) {
      setFormData({
        server: dbConfig.server || '',
        database: dbConfig.database || '',
        user: dbConfig.user || '',
        password: '',
      });
    }
  };

  const runSetup = async () => {
    setIsRunning(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/setup-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore nel setup');
      }

      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsRunning(false);
    }
  };

  const runCreateTable = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/create-movimenti-table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore nella creazione tabella');
      }

      setResults({ table: data.results, views: [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsRunning(false);
    }
  };

  const runApplyViews = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/apply-views`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore nell\'applicazione views');
      }

      setResults({ table: [], views: data.results });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Configurazione Database</h2>
            <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">DEMO</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Connection Status & Config */}
          <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Server className="w-4 h-4" />
                {isEditing ? 'Modifica Connessione' : 'Stato Connessione'}
              </h3>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <>
                    <button
                      onClick={testConnection}
                      disabled={isLoading}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                      Test
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      Modifica
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {!isEditing ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  {connectionStatus === 'connected' && (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-400 text-sm">Connesso</span>
                    </>
                  )}
                  {connectionStatus === 'error' && (
                    <>
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-red-400 text-sm">Errore connessione</span>
                    </>
                  )}
                  {connectionStatus === 'unknown' && (
                    <>
                      <div className="w-3 h-3 bg-gray-500 rounded-full" />
                      <span className="text-gray-400 text-sm">Non verificato</span>
                    </>
                  )}
                </div>

                {dbConfig && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-gray-500">Server:</div>
                    <div className="text-gray-300 font-mono">{dbConfig.server}</div>
                    <div className="text-gray-500">Database:</div>
                    <div className="text-gray-300 font-mono">{dbConfig.database}</div>
                    <div className="text-gray-500">Utente:</div>
                    <div className="text-gray-300 font-mono">{dbConfig.user}</div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Server</label>
                  <input
                    type="text"
                    value={formData.server}
                    onChange={(e) => setFormData(prev => ({ ...prev, server: e.target.value }))}
                    placeholder="es. localhost o 192.168.1.100"
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Database</label>
                  <input
                    type="text"
                    value={formData.database}
                    onChange={(e) => setFormData(prev => ({ ...prev, database: e.target.value }))}
                    placeholder="es. MyDatabase"
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Utente</label>
                  <input
                    type="text"
                    value={formData.user}
                    onChange={(e) => setFormData(prev => ({ ...prev, user: e.target.value }))}
                    placeholder="es. sa"
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={saveConfig}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded transition-colors text-sm font-medium"
                  >
                    {isSaving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Salva e Connetti
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={isSaving}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Azioni Database
            </h3>

            <button
              onClick={runSetup}
              disabled={isRunning || connectionStatus !== 'connected'}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              {isRunning ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              Esegui Setup Completo
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={runCreateTable}
                disabled={isRunning || connectionStatus !== 'connected'}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
              >
                <Database className="w-4 h-4" />
                Crea Tabella Movimenti
              </button>

              <button
                onClick={runApplyViews}
                disabled={isRunning || connectionStatus !== 'connected'}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
              >
                <Play className="w-4 h-4" />
                Applica Views SQL
              </button>
            </div>

            <p className="text-xs text-gray-500 italic">
              ⚠️ Queste operazioni modificano il database. Usare solo per demo/sviluppo.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-red-400 font-medium">Errore</div>
                <div className="text-red-300 text-sm">{error}</div>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-300">Risultati Esecuzione</h3>

              {results.table.length > 0 && (
                <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2">Tabella egmovimentimag3d</h4>
                  <div className="space-y-1">
                    {results.table.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {r.status === 'success' && <Check className="w-4 h-4 text-green-400" />}
                        {r.status === 'error' && <X className="w-4 h-4 text-red-400" />}
                        {r.status === 'skipped' && <AlertCircle className="w-4 h-4 text-yellow-400" />}
                        <span className={
                          r.status === 'success' ? 'text-green-400' :
                          r.status === 'error' ? 'text-red-400' : 'text-yellow-400'
                        }>
                          {r.status === 'success' ? 'Creato' : r.status === 'skipped' ? r.reason : r.error}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.views.length > 0 && (
                <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2">Views SQL</h4>
                  <div className="space-y-1">
                    {results.views.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {r.status === 'success' && <Check className="w-4 h-4 text-green-400" />}
                        {r.status === 'error' && <X className="w-4 h-4 text-red-400" />}
                        <span className="text-gray-400 font-mono">{r.file}</span>
                        {r.status === 'error' && (
                          <span className="text-red-400 text-xs">{r.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-900">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
