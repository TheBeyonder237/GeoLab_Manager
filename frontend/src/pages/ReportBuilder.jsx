import { useState, useEffect } from 'react';
import { FileText, Plus, Save, Download, Settings, Layout, DragHandleDots2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import toast from 'react-hot-toast';
import api from '../services/api';

const SECTION_TYPES = {
  TITLE: {
    name: 'Titre',
    icon: FileText,
    defaultProps: {
      text: 'Nouveau titre',
      level: 1,
      align: 'left'
    }
  },
  TEXT: {
    name: 'Texte',
    icon: FileText,
    defaultProps: {
      content: 'Nouveau paragraphe',
      style: 'normal'
    }
  },
  TABLE: {
    name: 'Tableau',
    icon: Layout,
    defaultProps: {
      headers: ['Colonne 1', 'Colonne 2'],
      rows: [['', '']]
    }
  },
  GRAPH: {
    name: 'Graphique',
    icon: Layout,
    defaultProps: {
      type: 'line',
      data: [],
      options: {}
    }
  },
  IMAGE: {
    name: 'Image',
    icon: FileText,
    defaultProps: {
      url: '',
      caption: '',
      width: '100%'
    }
  }
};

export default function ReportBuilder() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [sections, setSections] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [reportSettings, setReportSettings] = useState({
    title: 'Nouveau rapport',
    subtitle: '',
    logo: null,
    header: true,
    footer: true,
    pageNumbers: true,
    orientation: 'portrait',
    format: 'A4'
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.get('/rapports/templates/');
      setTemplates(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des modèles:', error);
      toast.error('Erreur lors du chargement des modèles');
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSections(items);
  };

  const addSection = (type) => {
    const newSection = {
      id: Date.now(),
      type,
      ...SECTION_TYPES[type].defaultProps
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (id, data) => {
    setSections(sections.map(section =>
      section.id === id ? { ...section, ...data } : section
    ));
  };

  const removeSection = (id) => {
    setSections(sections.filter(section => section.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        settings: reportSettings,
        sections: sections
      };

      await api.post('/rapports/templates/', data);
      toast.success('Modèle enregistré avec succès');
      loadTemplates();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format = 'pdf') => {
    try {
      const response = await api.post(`/rapports/export/${format}`, {
        settings: reportSettings,
        sections: sections
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportSettings.title}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8" />
              Générateur de rapports
            </h1>
            <p className="text-gray-600 mt-1">
              Créez des rapports personnalisés avec des sections réorganisables
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Settings className="w-5 h-5" />
              Paramètres
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Exporter PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Barre latérale */}
        <div className="col-span-3 space-y-6">
          {/* Types de sections */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ajouter une section
            </h2>
            <div className="space-y-2">
              {Object.entries(SECTION_TYPES).map(([type, { name, icon: Icon }]) => (
                <button
                  key={type}
                  onClick={() => addSection(type)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left"
                >
                  <Icon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">{name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Modèles */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Modèles
            </h2>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setReportSettings(template.settings);
                    setSections(template.sections);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left"
                >
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {template.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Zone d'édition */}
        <div className="col-span-9">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            {/* En-tête du rapport */}
            <div className="p-6 border-b border-gray-200">
              <input
                type="text"
                value={reportSettings.title}
                onChange={(e) => setReportSettings({ ...reportSettings, title: e.target.value })}
                className="text-2xl font-bold text-gray-900 w-full border-none focus:ring-0 p-0"
                placeholder="Titre du rapport"
              />
              <input
                type="text"
                value={reportSettings.subtitle}
                onChange={(e) => setReportSettings({ ...reportSettings, subtitle: e.target.value })}
                className="text-gray-600 w-full border-none focus:ring-0 p-0 mt-1"
                placeholder="Sous-titre (optionnel)"
              />
            </div>

            {/* Sections */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="p-6 space-y-4"
                  >
                    {sections.map((section, index) => (
                      <Draggable
                        key={section.id}
                        draggableId={section.id.toString()}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                              <div className="flex items-center gap-3">
                                <div {...provided.dragHandleProps}>
                                  <DragHandleDots2 className="w-5 h-5 text-gray-400" />
                                </div>
                                <span className="font-medium text-gray-900">
                                  {SECTION_TYPES[section.type].name}
                                </span>
                              </div>
                              <button
                                onClick={() => removeSection(section.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Supprimer
                              </button>
                            </div>
                            {/* Contenu de la section selon son type */}
                            {/* TODO: Implémenter les éditeurs spécifiques */}
                            <div className="p-4">
                              {section.type === 'TITLE' && (
                                <input
                                  type="text"
                                  value={section.text}
                                  onChange={(e) => updateSection(section.id, { text: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                              )}
                              {section.type === 'TEXT' && (
                                <textarea
                                  value={section.content}
                                  onChange={(e) => updateSection(section.id, { content: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  rows={4}
                                />
                              )}
                              {/* Autres types de sections... */}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {sections.length === 0 && (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Ajoutez des sections à votre rapport en utilisant les boutons à gauche
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
