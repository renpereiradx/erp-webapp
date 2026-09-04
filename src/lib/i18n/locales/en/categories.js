/**
 * Category Translations in English
 * Module: Logistics & Inventory > Categories
 */

export const categories = {
  'categories.title': 'Categories',
  'categories.subtitle': 'Manage product categories',

  'categories.management.title': 'Category Management',
  'categories.management.subtitle': 'Create, edit and delete product categories',
  'categories.management.new': 'New Category',
  'categories.management.search.placeholder': 'Search category...',
  'categories.management.empty': 'No categories found',

  'categories.section.title': 'Product Categories',

  'categories.drawer.new_title': 'New Category',
  'categories.drawer.edit_title': 'Edit Category',

  'categories.field.name': 'Name',
  'categories.field.name.placeholder': 'E.g. Electronics',
  'categories.field.name.required': 'Name is required',
  'categories.field.description': 'Description',
  'categories.field.description.placeholder': 'Brief description...',
  'categories.field.tax_rate': 'Default Tax Rate',
  'categories.field.tax_rate.placeholder': 'Select rate...',
  'categories.field.parent': 'Parent Category',
  'categories.field.parent.none': 'None (Root)',
  'categories.field.parent.none_short': 'None',
  'categories.field.is_active': 'Active Category',

  'categories.tax_rate.general': 'General (10%)',
  'categories.tax_rate.id': 'ID: {id}',

  'categories.table.name': 'Name',
  'categories.table.description': 'Description',
  'categories.table.tax_rate': 'Default VAT',
  'categories.table.status': 'Status',
  'categories.table.actions': 'Actions',

  'categories.status.active': 'Active',
  'categories.status.inactive': 'Inactive',

  'categories.action.save': 'Save Category',
  'categories.action.cancel': 'Cancel',
  'categories.action.edit': 'Edit {name}',
  'categories.action.delete': 'Delete {name}',

  'categories.delete.title': 'Delete category',
  'categories.delete.description': 'Are you sure you want to delete the category "{name}"? This action cannot be undone.',
  'categories.delete.confirm': 'Delete',
  'categories.delete.deleting': 'Deleting...',

  'categories.toast.created': 'Category created successfully',
  'categories.toast.updated': 'Category updated successfully',
  'categories.toast.deleted': 'Category deleted successfully',
  'categories.toast.create_error': 'Error saving the category',
  'categories.toast.delete_error': 'Error deleting the category',
  'categories.toast.load_error': 'Error loading categories',

  'products.modal.category.manage': 'Manage categories…',

  // Category tree (dedicated page)
  'categories.page.title': 'Categories & Taxes',
  'categories.page.subtitle': 'Organize the catalog and its tax configuration',
  'categories.search.placeholder': 'Search categories...',
  'categories.count': '{count} categories',
  'categories.welcome_title': 'No category selected',
  'categories.welcome_description':
    'Select a category from the tree to edit its detail and tax classification, or create a new one.',
  'categories.tree.title': 'Category Tree',
  'categories.tree.add': 'New category',
  'categories.tree.empty': 'No categories yet',
  'categories.tree.empty_description': 'Create the first catalog category.',

  // Detail form (dedicated page)
  'categories.form.editing': 'Editing Category',
  'categories.form.creating': 'New Category',
  'categories.form.select_empty_title': 'No category selected',
  'categories.form.select_empty': 'Select a category from the tree or create a new one',
  'categories.form.name_placeholder': 'E.g. Sports',
  'categories.form.description_placeholder': 'Category description',
  'categories.form.tax_none': 'Unassigned',
  'categories.form.delete': 'Delete',
  'categories.form.save': 'Save Changes',

  // Tax rates & SIFEN classification panel
  'categories.tax.title': 'VAT Rates & SIFEN Classification',
  'categories.tax.subtitle': 'Manage taxes and their relation to electronic invoicing.',
  'categories.tax.config_title': 'Tax Setup: {name}',
  'categories.tax.badge_classified': 'SIFEN: {code}',
  'categories.tax.badge_checking': 'Checking...',
  'categories.tax.badge_unclassified': 'Unclassified',
  'categories.tax.default_rate': 'Default Rate: {rate}%',
  'categories.tax.no_rate': 'No Rate',
  'categories.tax.select_label': 'SIFEN Classification for Products',
  'categories.tax.select_placeholder': 'Select classification...',
  'categories.tax.action_update': 'Update Classification',
  'categories.tax.action_apply': 'Auto-Classify Products',
  'categories.tax.applied_note':
    'This category already has classification {code} applied. You can re-classify if you added unassigned products or want to change the tax code for the whole group.',
  'categories.tax.pending_note':
    'Auto-classification will massively apply the SIFEN code and the corresponding tax rate to all current products in category {name}.',
  'categories.tax.empty_no_category': 'No category selected',
  'categories.tax.empty_no_category_desc':
    'Select a category from the tree to manage its SIFEN tax classification and apply VAT rates to its products.',
  'categories.tax.rates_title': 'Rates Registered in the System',
  'categories.tax.table.code': 'SIFEN Code',
  'categories.tax.table.name': 'Tax Name',
  'categories.tax.table.rate': 'Rate',
  'categories.tax.table.status': 'Status',
  'categories.tax.table.empty': 'No VAT rates configured.',
  'categories.tax.table.empty_description': 'VAT rates are registered from the financial settings.',
  'categories.tax.badge_default_cat': 'Category Default',
  'categories.tax.status_exempt': 'Exempt',
  'categories.tax.status_taxed': 'Taxed',
  'categories.tax.sync_title': 'Automatic SIFEN Sync',
  'categories.tax.sync_desc':
    'The VAT rates configured in this panel are automatically mapped to the official SET codes when issuing Electronic Documents (KUDE). Make sure the percentages match current regulations.',
  'categories.tax.confirm.title': 'Confirm Auto-Classification',
  'categories.tax.confirm.body':
    'Apply tax classification {code} to all products in category {name}?',
  'categories.tax.confirm.warning':
    'This operation will irrevocably update the SIFEN classification and tax rate for the products under this category.',
  'categories.tax.confirm.apply': 'Confirm & Apply',
  'categories.tax.toast.applied': 'Classification {code} successfully applied to {count} products.',
  'categories.tax.toast.executed': 'Classification {code} executed for the category.',
  'categories.tax.toast.apply_error': 'Error applying tax classification to the category',
  'categories.tax.toast.load_codes_error': 'Error loading SIFEN codes',

  // Per-category attributes manager (drawer / modal)
  'categories.attributesPanel.title': 'Category Attributes',
  'categories.attributesPanel.subtitle':
    'These attributes will apply to all products in this category.',
  'categories.attributesPanel.empty': 'No attributes defined for this category',
  'categories.attributesPanel.new_title': 'New Attribute',
  'categories.attributesPanel.name_placeholder': 'Name (e.g. Size)',
  'categories.attributesPanel.code_placeholder': 'Code (e.g. size)',
  'categories.attributesPanel.options_placeholder': 'Options (e.g. S, M, L)',
  'categories.attributesPanel.options_label': 'Options:',
  'categories.attributesPanel.code_label': 'Code:',
  'categories.attributesPanel.variant': 'Variant',
  'categories.attributesPanel.variant_hint': 'Use to generate variants (e.g. Size, Color)',
  'categories.attributesPanel.create': 'Create Attribute',
  'categories.attributesPanel.data_type.STRING': 'Short Text (String)',
  'categories.attributesPanel.data_type.NUMBER': 'Number',
  'categories.attributesPanel.data_type.BOOLEAN': 'Yes/No (Boolean)',
  'categories.attributesPanel.data_type.DATE': 'Date',
  'categories.attributesPanel.data_type.LIST': 'List (Single choice)',
  'categories.attributesPanel.data_type.MULTI_SELECT': 'Multi Select',
  'categories.attributesPanel.delete.title': 'Delete category attribute',
  'categories.attributesPanel.delete.description':
    'Are you sure you want to delete the attribute "{name}"? It will affect all products in this category.',
  'categories.attributesPanel.toast.load_error': 'Error loading category attributes',
  'categories.attributesPanel.toast.name_code_required': 'Name and code are required',
  'categories.attributesPanel.toast.options_required': 'Comma-separated options are required',
  'categories.attributesPanel.toast.created': 'Attribute created successfully',
  'categories.attributesPanel.toast.deleted': 'Attribute deleted',
  'categories.attributesPanel.toast.create_error': 'Error creating attribute',
  'categories.attributesPanel.toast.delete_error': 'Error deleting attribute',
}
