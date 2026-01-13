'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/header';
import { Settings, DollarSign, Euro, Percent, Truck, Save, RefreshCw, Bell, Trash2 } from 'lucide-react';

interface SettingsData {
  baseCurrency: string;
  fxRateEurUsd: number;
  minRoiThreshold: number;
  tcgplayerFee: number;
  cardmarketFee: number;
  marketplaceFee: number;
  shippingCost: number;
  importAlertThreshold: number;
}

interface Alert {
  id: number;
  cardId: string;
  cardName: string;
  email: string;
  roiThreshold: number;
  triggered: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    baseCurrency: 'USD',
    fxRateEurUsd: 1.08,
    minRoiThreshold: 10,
    tcgplayerFee: 0.1,
    cardmarketFee: 0.05,
    marketplaceFee: 0.12,
    shippingCost: 5,
    importAlertThreshold: 3,
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(console.error);

    fetch('/api/alerts')
      .then((res) => res.json())
      .then((data) => setAlerts(data.alerts ?? []))
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
    setSaving(false);
  };

  const handleDeleteAlert = async (id: number) => {
    try {
      await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
      setAlerts(alerts.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950">
      <Header />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-white">Settings</h1>
        </div>

        <div className="grid gap-6">
          {/* Currency Settings */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Currency & FX
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Base Currency</label>
                <select
                  value={settings.baseCurrency}
                  onChange={(e) => setSettings({ ...settings, baseCurrency: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1 flex items-center gap-1">
                  <Euro className="w-4 h-4" /> EUR/USD Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.fxRateEurUsd}
                  onChange={(e) => setSettings({ ...settings, fxRateEurUsd: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Fees Settings */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5 text-orange-500" />
              Taxas de Compra
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">TCGplayer Fee (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.tcgplayerFee * 100}
                  onChange={(e) => setSettings({ ...settings, tcgplayerFee: (parseFloat(e.target.value) || 0) / 100 })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Cardmarket Fee (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.cardmarketFee * 100}
                  onChange={(e) => setSettings({ ...settings, cardmarketFee: (parseFloat(e.target.value) || 0) / 100 })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1 flex items-center gap-1">
                  <Truck className="w-4 h-4" /> Frete Internacional ($)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.shippingCost}
                  onChange={(e) => setSettings({ ...settings, shippingCost: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Marketplace BR Fee */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5 text-green-500" />
              Taxa de Venda (Marketplace BR)
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Taxa cobrada pelo marketplace brasileiro (Mercado Livre, Shopee, etc) na revenda das cartas.
              Essa taxa é descontada automaticamente no cálculo do ROI.
            </p>
            <div className="max-w-xs">
              <label className="block text-sm text-gray-400 mb-1">Taxa do Marketplace (%)</label>
              <input
                type="number"
                step="0.5"
                value={settings.marketplaceFee * 100}
                onChange={(e) => setSettings({ ...settings, marketplaceFee: (parseFloat(e.target.value) || 0) / 100 })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">Padrão: 12% (Mercado Livre)</p>
            </div>
          </div>

          {/* Threshold Settings */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-4">Configurações de Alerta</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">ROI Mínimo (%)</label>
                <input
                  type="number"
                  step="1"
                  value={settings.minRoiThreshold}
                  onChange={(e) => setSettings({ ...settings, minRoiThreshold: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Filtro padrão de oportunidades</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Alerta de Importação (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.importAlertThreshold}
                  onChange={(e) => setSettings({ ...settings, importAlertThreshold: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Alerta quando dólar cair X% da média semanal</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Settings'}
          </button>

          {/* Alerts Section */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mt-4">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-500" />
              Price Alerts
            </h2>
            {alerts.length === 0 ? (
              <p className="text-gray-400">No alerts configured. Create alerts from card detail pages.</p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                    <div>
                      <span className="text-white font-medium">{alert.cardName}</span>
                      <span className="text-gray-400 text-sm ml-2">ROI ≥ {alert.roiThreshold}%</span>
                      <span className="text-gray-500 text-sm ml-2">→ {alert.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {alert.triggered && <span className="text-green-500 text-sm">✓ Triggered</span>}
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="text-red-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
