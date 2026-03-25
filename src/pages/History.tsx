import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Search, Calendar, Download, Trash2, Eye, FileText, Users, MapPin, X } from 'lucide-react';
import { ImportedFileService } from '@/services/importedFileService';
import { RouteGroupService } from '@/services/routeGroupService';

interface ImportedFile {
  id: number;
  nome_arquivo: string;
  tipo_arquivo: 'pdf' | 'xlsx' | 'xls' | 'csv';
  tamanho_arquivo: number;
  quantidade_registros: number;
  data_importacao: string;
  status_importacao: 'processing' | 'completed' | 'failed';
}

interface RouteGroup {
  id: number;
  nome: string;
  cor: string;
  motorista_id?: string;
  data_criacao: string;
  ativo: boolean;
  deliveryCount?: number;
  completedCount?: number;
}

const History = () => {
  const [files, setFiles] = useState<ImportedFile[]>([]);
  const [routeGroups, setRouteGroups] = useState<RouteGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'files' | 'routes'>('files');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ImportedFile | RouteGroup | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando dados do histórico...');
      
      const [files, routes] = await Promise.all([
        ImportedFileService.findAll(),
        RouteGroupService.findAll()
      ]);
      
      console.log('📄 Arquivos carregados:', files);
      console.log('🚚 Rotas carregadas:', routes);
      
      setFiles(files);
      setRouteGroups(routes);
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      alert('Erro ao carregar histórico: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = (file: ImportedFile) => {
    console.log('👁 Clicou para visualizar arquivo:', file);
    setSelectedItem(file);
    setShowViewModal(true);
  };

  const handleViewRoute = (route: RouteGroup) => {
    console.log('👁 Clicou para visualizar rota:', route);
    setSelectedItem(route);
    setShowViewModal(true);
  };

  const handleDownloadFile = async (file: ImportedFile) => {
    try {
      console.log('📥 Baixando arquivo:', file.nome_arquivo);
      
      const mockFileContent = `Conteúdo do arquivo: ${file.nome_arquivo}
Tipo: ${file.tipo_arquivo}
Tamanho: ${file.tamanho_arquivo} bytes
Registros: ${file.quantidade_registros}
Data: ${file.data_importacao}
Status: ${file.status_importacao}`;

      const blob = new Blob([mockFileContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.nome_arquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Download iniciado');
    } catch (error) {
      console.error('❌ Erro ao baixar arquivo:', error);
      alert('Erro ao baixar arquivo. Tente novamente.');
    }
  };

  const handleDownloadRoute = async (route: RouteGroup) => {
    try {
      console.log('📥 Baixando rota:', route.nome);
      
      const routeData = {
        id: route.id,
        nome: route.nome,
        cor: route.cor,
        motorista_id: route.motorista_id,
        data_criacao: route.data_criacao,
        deliveryCount: route.deliveryCount,
        completedCount: route.completedCount,
        ativo: route.ativo
      };

      const blob = new Blob([JSON.stringify(routeData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rota_${route.nome.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Download da rota iniciado');
    } catch (error) {
      console.error('❌ Erro ao baixar rota:', error);
      alert('Erro ao baixar rota. Tente novamente.');
    }
  };

  const filteredFiles = files.filter(file =>
    file.nome_arquivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.tipo_arquivo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRoutes = routeGroups.filter(route =>
    route.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'processing': return 'Processando';
      case 'failed': return 'Erro';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Histórico e Consultas</h1>
          <p className="text-muted-foreground">
            Visualize e consulte dados de importações anteriores e rotas criadas
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('files')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'files'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="w-4 h-4 mr-2" />
                Arquivos Importados
              </button>
              <button
                onClick={() => setActiveTab('routes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'routes'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Grupos de Rotas
              </button>
            </nav>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nome ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        ) : (
          <>
            {activeTab === 'files' && (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Arquivo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Tamanho
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Registros
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {filteredFiles.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                            Nenhum arquivo encontrado
                          </td>
                        </tr>
                      ) : (
                        filteredFiles.map((file) => (
                          <tr key={file.id} className="hover:bg-muted/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                                <div>
                                  <p className="font-medium text-foreground">{file.nome_arquivo}</p>
                                  <p className="text-sm text-muted-foreground">{formatFileSize(file.tamanho_arquivo)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(file.status_importacao)}`}>
                                {file.tipo_arquivo.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {formatFileSize(file.tamanho_arquivo)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {file.quantidade_registros}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(file.status_importacao)}`}>
                                {getStatusText(file.status_importacao)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {formatDate(file.data_importacao)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => handleViewFile(file)}
                                  className="text-primary hover:text-primary/80 transition-colors"
                                  title="Visualizar arquivo"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDownloadFile(file)}
                                  className="text-primary hover:text-primary/80 transition-colors"
                                  title="Baixar arquivo"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'routes' && (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Rota
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Cor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Entregas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Progresso
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Motorista
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {filteredRoutes.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                            Nenhuma rota encontrada
                          </td>
                        </tr>
                      ) : (
                        filteredRoutes.map((route) => (
                          <tr key={route.id} className="hover:bg-muted/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                                <span className="font-medium text-foreground">{route.nome}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div 
                                  className="w-6 h-6 rounded-full"
                                  style={{ backgroundColor: route.cor }}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {route.deliveryCount || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-sm text-muted-foreground mr-2">
                                  {route.completedCount || 0}
                                </span>
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ 
                                      width: `${route.deliveryCount > 0 ? ((route.completedCount || 0) / route.deliveryCount) * 100 : 0}%` 
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {route.motorista_id ? (
                                <div className="flex items-center">
                                  <Users className="w-4 h-4 mr-1" />
                                  <span>Atribuído</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">Não atribuído</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {formatDate(route.data_criacao)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => handleViewRoute(route)}
                                  className="text-primary hover:text-primary/80 transition-colors"
                                  title="Visualizar rota"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDownloadRoute(route)}
                                  className="text-primary hover:text-primary/80 transition-colors"
                                  title="Baixar rota"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal de Visualização */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 overflow-y-auto" style={{ maxHeight: '90vh' }}>
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">
                {'nome_arquivo' in selectedItem ? 'Detalhes do Arquivo' : 'Detalhes da Rota'}
              </h2>
              <button
                onClick={() => {
                  console.log('❌ Fechando modal');
                  setShowViewModal(false);
                  setSelectedItem(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {'nome_arquivo' in selectedItem ? (
                // Visualização de Arquivo
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Arquivo</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{(selectedItem as ImportedFile).nome_arquivo}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{(selectedItem as ImportedFile).tipo_arquivo.toUpperCase()}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{formatFileSize((selectedItem as ImportedFile).tamanho_arquivo)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registros</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{(selectedItem as ImportedFile).quantidade_registros}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor((selectedItem as ImportedFile).status_importacao)}`}>
                        {getStatusText((selectedItem as ImportedFile).status_importacao)}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data da Importação</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{formatDate((selectedItem as ImportedFile).data_importacao)}</p>
                  </div>
                </div>
              ) : (
                // Visualização de Rota
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Rota</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{(selectedItem as RouteGroup).nome}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: (selectedItem as RouteGroup).cor }}
                        />
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{(selectedItem as RouteGroup).cor}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Motorista</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {(selectedItem as RouteGroup).motorista_id ? (
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            <span>Atribuído</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Não atribuído</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(selectedItem as RouteGroup).ativo ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                          {(selectedItem as RouteGroup).ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total de Entregas</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{(selectedItem as RouteGroup).deliveryCount || 0}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Entregas Concluídas</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{(selectedItem as RouteGroup).completedCount || 0}</p>
                    </div>
                  </div>
                  
                  {(selectedItem as RouteGroup).deliveryCount && (selectedItem as RouteGroup).completedCount && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Progresso</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ 
                              width: `${(selectedItem as RouteGroup).deliveryCount > 0 ? ((selectedItem as RouteGroup).completedCount / (selectedItem as RouteGroup).deliveryCount) * 100 : 0}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {(selectedItem as RouteGroup).deliveryCount > 0 ? Math.round(((selectedItem as RouteGroup).completedCount / (selectedItem as RouteGroup).deliveryCount) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Criação</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{formatDate((selectedItem as RouteGroup).data_criacao)}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedItem(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fechar
                </button>
                {'nome_arquivo' in selectedItem ? (
                  <button
                    onClick={() => handleDownloadFile(selectedItem as ImportedFile)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Arquivo
                  </button>
                ) : (
                  <button
                    onClick={() => handleDownloadRoute(selectedItem as RouteGroup)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Rota
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
