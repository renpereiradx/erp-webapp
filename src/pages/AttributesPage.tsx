import React, { useState } from 'react';
import { useAttributes } from '@/hooks/useAttributes';
import { AttributesTab } from '@/components/attributes/AttributesTab';
import { TagsTab } from '@/components/attributes/TagsTab';

export const AttributesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'attributes' | 'tags'>('attributes');
  const {
    filteredAttributes,
    filteredTags,
    searchAttrTerm,
    setSearchAttrTerm,
    searchTagTerm,
    setSearchTagTerm,
    selectedAttribute,
    setSelectedAttribute,
    selectedTag,
    setSelectedTag,
    categories,
    loading,
    handleCreateNew,
    handleCreateNewTag,
    handleSaveAttribute,
    handleDeleteAttribute,
    handleSaveTag,
    handleDeleteTag,
  } = useAttributes();

  return (
    <div className="flex-1 flex flex-col min-h-screen relative bg-surface">
      <header className="flex justify-between items-center w-full px-lg max-w-container-max mx-auto h-16 sticky top-0 z-30 bg-surface shadow-sm">
        <div className="flex items-center space-x-lg">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-black text-primary">Attribute Manager</h2>
        </div>
      </header>

      <main className="flex-1 p-md md:p-gutter flex flex-col overflow-hidden">
        {/* Page Header */}
        <div className="flex justify-between items-end border-b border-outline-variant/30 mb-lg">
          {/* Tabs */}
          <div className="flex">
            <button 
              onClick={() => setActiveTab('attributes')}
              className={`font-body-sm-bold text-body-sm-bold pb-sm px-4 transition-colors ${activeTab === 'attributes' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
            >
              Definición de Atributos
            </button>
            <button 
              onClick={() => setActiveTab('tags')}
              className={`font-body-sm-bold text-body-sm-bold pb-sm px-4 transition-colors ${activeTab === 'tags' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
            >
              Etiquetas (Tags)
            </button>
          </div>
          
          <button 
            onClick={activeTab === 'attributes' ? handleCreateNew : handleCreateNewTag}
            className="bg-primary text-on-primary py-2 px-6 font-body-sm-bold hover:bg-primary-container hover:text-on-primary-container transition-colors"
          >
            {activeTab === 'attributes' ? 'Nuevo Atributo' : 'Nueva Etiqueta'}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'attributes' ? (
          <AttributesTab 
            attributes={filteredAttributes}
            categories={categories}
            searchTerm={searchAttrTerm}
            onSearchChange={setSearchAttrTerm}
            selectedAttribute={selectedAttribute}
            onSelectAttribute={setSelectedAttribute}
            onSaveAttribute={handleSaveAttribute}
            onDeleteAttribute={handleDeleteAttribute}
            loading={loading}
          />
        ) : (
          <TagsTab 
            tags={filteredTags}
            categories={categories}
            searchTerm={searchTagTerm}
            onSearchChange={setSearchTagTerm}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
            onSaveTag={handleSaveTag}
            onDeleteTag={handleDeleteTag}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
};
