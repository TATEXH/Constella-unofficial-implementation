import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner, Modal, Badge } from 'react-bootstrap';
import axios from 'axios';

const SettingsPanel = ({ onClose }) => {
  const [providers, setProviders] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  useEffect(() => {
    loadProviders();
    loadCurrentSettings();
  }, []);

  const loadProviders = async () => {
    try {
      const response = await axios.get('/api/settings/ai-providers');
      setProviders(response.data);
    } catch (error) {
      setAlert({ type: 'danger', message: 'プロバイダー情報の取得に失敗しました' });
    }
  };

  const loadCurrentSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/settings/ai-provider');
      setFormData(response.data);
    } catch (error) {
      setAlert({ type: 'danger', message: '現在の設定の取得に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (provider) => {
    setFormData(prev => ({
      ...prev,
      provider: provider
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.post('/api/settings/ai-provider', formData);
      await loadCurrentSettings();
      setAlert({ type: 'success', message: '設定を保存しました' });
    } catch (error) {
      setAlert({ type: 'danger', message: '設定の保存に失敗しました' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      // 現在のフォーム入力値をテストAPIに送信
      const response = await axios.post('/api/settings/ai-provider/test', formData);

      if (response.data.success) {
        setAlert({
          type: 'success',
          message: `接続テスト成功: ${response.data.response}`
        });
      } else {
        setAlert({
          type: 'danger',
          message: `接続テスト失敗: ${response.data.error}`
        });
      }
    } catch (error) {
      // エラーレスポンスから詳細情報を取得
      let errorMessage = '接続テストに失敗しました';

      if (error.response?.data?.error) {
        // バックエンドからのエラーメッセージ
        errorMessage = `接続テスト失敗: ${error.response.data.error}`;
      } else if (error.response?.data?.detail) {
        // FastAPIのHTTPExceptionからのエラー
        errorMessage = `エラー: ${error.response.data.detail}`;
      } else if (error.message) {
        // Axiosのエラーメッセージ
        errorMessage = `エラー: ${error.message}`;
      }

      setAlert({ type: 'danger', message: errorMessage });
    } finally {
      setTesting(false);
    }
  };

  const getProviderInfo = (providerName) => {
    return providers.find(p => p.name === providerName);
  };

  const renderProviderConfig = () => {
    if (!formData.provider) return null;

    const provider = getProviderInfo(formData.provider);
    if (!provider) return null;

    switch (formData.provider) {
      case 'ollama':
        return (
          <div>
            <Form.Group className="mb-3">
              <Form.Label>API URL</Form.Label>
              <Form.Control
                type="text"
                value={formData.ollama_api_url || ''}
                onChange={(e) => handleInputChange('ollama_api_url', e.target.value)}
                placeholder="http://192.168.1.7:11434"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>モデル</Form.Label>
              <Form.Control
                type="text"
                value={formData.ollama_model || ''}
                onChange={(e) => handleInputChange('ollama_model', e.target.value)}
                placeholder="gpt-oss:20B"
              />
              <Form.Text className="text-muted">
                利用可能モデル例: {provider.available_models.join(', ')}
              </Form.Text>
            </Form.Group>
          </div>
        );

      case 'openai':
        return (
          <div>
            <Form.Group className="mb-3">
              <Form.Label>API キー</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="password"
                  value={formData.openai_api_key || ''}
                  onChange={(e) => handleInputChange('openai_api_key', e.target.value)}
                  placeholder="sk-..."
                />
                <Button
                  variant="outline-info"
                  className="ms-2"
                  onClick={() => setShowApiKeyModal(true)}
                >
                  ?
                </Button>
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>モデル</Form.Label>
              <Form.Control
                type="text"
                value={formData.openai_model || ''}
                onChange={(e) => handleInputChange('openai_model', e.target.value)}
                placeholder="gpt-4"
              />
              <Form.Text className="text-muted">
                利用可能モデル例: {provider.available_models.join(', ')}
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Base URL（カスタムエンドポイント用）</Form.Label>
              <Form.Control
                type="text"
                value={formData.openai_base_url || ''}
                onChange={(e) => handleInputChange('openai_base_url', e.target.value)}
                placeholder="https://api.openai.com/v1"
              />
            </Form.Group>
          </div>
        );

      case 'anthropic':
        return (
          <div>
            <Form.Group className="mb-3">
              <Form.Label>API キー</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="password"
                  value={formData.anthropic_api_key || ''}
                  onChange={(e) => handleInputChange('anthropic_api_key', e.target.value)}
                  placeholder="sk-ant-..."
                />
                <Button
                  variant="outline-info"
                  className="ms-2"
                  onClick={() => setShowApiKeyModal(true)}
                >
                  ?
                </Button>
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>モデル</Form.Label>
              <Form.Control
                type="text"
                value={formData.anthropic_model || ''}
                onChange={(e) => handleInputChange('anthropic_model', e.target.value)}
                placeholder="claude-3-sonnet-20240229"
              />
              <Form.Text className="text-muted">
                利用可能モデル例: {provider.available_models.join(', ')}
              </Form.Text>
            </Form.Group>
          </div>
        );

      case 'google':
        return (
          <div>
            <Form.Group className="mb-3">
              <Form.Label>API キー</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="password"
                  value={formData.google_api_key || ''}
                  onChange={(e) => handleInputChange('google_api_key', e.target.value)}
                  placeholder="AIza..."
                />
                <Button
                  variant="outline-info"
                  className="ms-2"
                  onClick={() => setShowApiKeyModal(true)}
                >
                  ?
                </Button>
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>モデル</Form.Label>
              <Form.Control
                type="text"
                value={formData.google_model || ''}
                onChange={(e) => handleInputChange('google_model', e.target.value)}
                placeholder="gemini-pro"
              />
              <Form.Text className="text-muted">
                利用可能モデル例: {provider.available_models.join(', ')}
              </Form.Text>
            </Form.Group>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" />
        <p className="mt-2">設定を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-gear me-2"></i>
                AI プロバイダー設定
              </h5>
              <Button variant="outline-secondary" size="sm" onClick={onClose}>
                ✕
              </Button>
            </Card.Header>
            <Card.Body>
              {alert && (
                <Alert
                  variant={alert.type}
                  dismissible
                  onClose={() => setAlert(null)}
                >
                  {alert.message}
                </Alert>
              )}

              <Form>
                <Form.Group className="mb-4">
                  <Form.Label>AI プロバイダーを選択</Form.Label>
                  <div className="row">
                    {providers.map(provider => (
                      <div key={provider.name} className="col-md-6 col-lg-3 mb-3">
                        <Card
                          className={`provider-card ${formData.provider === provider.name ? 'border-primary' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleProviderChange(provider.name)}
                        >
                          <Card.Body className="text-center p-3">
                            <h6 className="mb-2">
                              {provider.display_name}
                              {formData.provider === provider.name && (
                                <Badge bg="primary" className="ms-2">選択中</Badge>
                              )}
                            </h6>
                            <small className="text-muted">{provider.description}</small>
                            {provider.requires_api_key && (
                              <div className="mt-2">
                                <Badge bg="warning">API キー必要</Badge>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </div>
                    ))}
                  </div>
                </Form.Group>

                {renderProviderConfig()}

                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        保存中...
                      </>
                    ) : (
                      '設定を保存'
                    )}
                  </Button>

                  <Button
                    variant="outline-success"
                    onClick={handleTest}
                    disabled={testing || !formData.provider}
                  >
                    {testing ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        テスト中...
                      </>
                    ) : (
                      '接続テスト'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* API キー取得方法のモーダル */}
      <Modal show={showApiKeyModal} onHide={() => setShowApiKeyModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>API キーの取得方法</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <h6>OpenAI API キー</h6>
            <p>
              1. <a href="https://platform.openai.com/" target="_blank" rel="noopener noreferrer">OpenAI Platform</a> にアクセス<br />
              2. アカウント作成またはログイン<br />
              3. 「API keys」セクションで新しいキーを作成<br />
              4. 「sk-」で始まるキーをコピー
            </p>
          </div>

          <div className="mb-4">
            <h6>Anthropic API キー</h6>
            <p>
              1. <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">Anthropic Console</a> にアクセス<br />
              2. アカウント作成またはログイン<br />
              3. 「API Keys」でキーを作成<br />
              4. 「sk-ant-」で始まるキーをコピー
            </p>
          </div>

          <div className="mb-4">
            <h6>Google AI API キー</h6>
            <p>
              1. <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer">Google AI Studio</a> にアクセス<br />
              2. Googleアカウントでログイン<br />
              3. 「Get API key」でキーを作成<br />
              4. 「AIza」で始まるキーをコピー
            </p>
          </div>

          <Alert variant="warning">
            <strong>注意:</strong> API キーは機密情報です。他人と共有しないでください。
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApiKeyModal(false)}>
            閉じる
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SettingsPanel;