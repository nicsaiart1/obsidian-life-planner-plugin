<script lang="ts">
  import { onMount, tick } from 'svelte';
  import * as ContactService from '../ContactService';
  import * as InteractionLogService from '../InteractionLogService';
  import type { Contact, InteractionLog, InteractionType } from '../types';
  import { InteractionTypeARR } from './constants'; // Will create this file

  // State variables
  let contacts: Contact[] = [];
  let interactionsForSelectedContact: InteractionLog[] = [];
  let selectedContact: Contact | null = null;
  
  let relationshipTypes: string[] = []; // To populate filter
  let selectedRelationshipTypeFilter: string = '';


  // Form visibility & state
  let showContactForm = false;
  let editingContact = false;
  let contactForm: Partial<Contact> = {};

  let showInteractionForm = false;
  let editingInteraction = false;
  let interactionForm: Partial<InteractionLog> & { contactId?: string } = {};

  // --- Data Loading ---
  async function loadContacts() {
    contacts = ContactService.getAllContacts('name', selectedRelationshipTypeFilter ? { relationshipType: selectedRelationshipTypeFilter } : undefined);
    // Populate relationship types for filter dropdown
    const allTypes = ContactService.getAllContacts().map(c => c.relationshipType).filter(rt => !!rt) as string[];
    relationshipTypes = [...new Set(allTypes)].sort();

  }

  async function loadInteractionsForContact(contactId: string) {
    interactionsForSelectedContact = InteractionLogService.getInteractionsForContact(contactId, 'date');
  }

  // --- Contact Actions ---
  async function handleSelectContact(contact: Contact | null) {
    selectedContact = contact;
    if (contact) {
      await loadInteractionsForContact(contact.id);
    } else {
      interactionsForSelectedContact = [];
    }
    // Hide forms when selection changes
    showContactForm = false;
    showInteractionForm = false;
  }
  
  function handleFilterChange() {
      loadContacts();
      // If current selected contact doesn't match filter, deselect it
      if (selectedContact && selectedRelationshipTypeFilter && selectedContact.relationshipType !== selectedRelationshipTypeFilter) {
          handleSelectContact(null);
      }
  }

  function openNewContactForm() {
    editingContact = false;
    contactForm = { name: '', relationshipType: relationshipTypes[0] || '' };
    showContactForm = true;
  }

  function openEditContactForm(contact: Contact) {
    editingContact = true;
    contactForm = { ...contact }; // Clone to form
    showContactForm = true;
  }

  async function saveContact() {
    if (!contactForm.name?.trim()) {
      alert('Contact name is required.');
      return;
    }
    if (editingContact && contactForm.id) {
      ContactService.updateContact(contactForm.id, contactForm);
    } else {
      ContactService.addContact(contactForm as Omit<Contact, 'id'|'createdAt'|'updatedAt'|'lastContactedDate'>);
    }
    await loadContacts();
    // If editing selected contact, refresh it
    if (selectedContact && selectedContact.id === contactForm.id) {
        const updatedSelectedContact = ContactService.getContact(selectedContact.id);
        if (updatedSelectedContact) handleSelectContact(updatedSelectedContact);
    }
    showContactForm = false;
  }
  
  async function deleteSelectedContact() {
      if (selectedContact && confirm(`Are you sure you want to delete ${selectedContact.name}? This will also delete all interaction logs for this contact.`)) {
          // First, delete all interactions for this contact
          const interactions = InteractionLogService.getInteractionsForContact(selectedContact.id);
          interactions.forEach(interaction => InteractionLogService.deleteInteractionLog(interaction.id));
          
          ContactService.deleteContact(selectedContact.id);
          await loadContacts();
          handleSelectContact(null); // Deselect
      }
  }

  // --- Interaction Actions ---
  function openNewInteractionForm() {
    if (!selectedContact) return;
    editingInteraction = false;
    interactionForm = { 
        contactId: selectedContact.id, 
        date: new Date().toISOString().substring(0, 16), // Default to now, for datetime-local
        type: InteractionTypeARR[0] as InteractionType, 
        description: '' 
    };
    showInteractionForm = true;
  }

  function openEditInteractionForm(interaction: InteractionLog) {
    editingInteraction = true;
    // Ensure date is in 'yyyy-MM-ddThh:mm' format for datetime-local input
    interactionForm = { ...interaction, date: interaction.date.substring(0, 16) };
    showInteractionForm = true;
  }

  async function saveInteraction() {
    if (!interactionForm.description?.trim() || !interactionForm.contactId || !interactionForm.date) {
      alert('Contact, Date, and Description are required for an interaction.');
      return;
    }
     // Convert local datetime string back to ISO string if necessary
    interactionForm.date = new Date(interactionForm.date).toISOString();

    if (editingInteraction && interactionForm.id) {
      InteractionLogService.updateInteractionLog(interactionForm.id, interactionForm as Omit<InteractionLog, 'id'|'createdAt'>);
    } else {
      InteractionLogService.logInteraction(interactionForm as Omit<InteractionLog, 'id'|'createdAt'>);
    }
    if (selectedContact) { // Refresh interactions for current contact
      await loadInteractionsForContact(selectedContact.id);
      // Also refresh the contact itself in case lastContactedDate changed
      const updatedContact = ContactService.getContact(selectedContact.id);
      if (updatedContact) selectedContact = updatedContact; // Keep selectedContact reactive
    }
    showInteractionForm = false;
  }

  async function deleteInteraction(interactionId: string) {
      if (confirm('Are you sure you want to delete this interaction log?')) {
          InteractionLogService.deleteInteractionLog(interactionId);
          if (selectedContact) {
            await loadInteractionsForContact(selectedContact.id);
            // Refresh contact for lastContactedDate
             const updatedContact = ContactService.getContact(selectedContact.id);
             if (updatedContact) selectedContact = updatedContact;
          }
      }
  }
  
  function formatDate(isoString?: string): string {
      if (!isoString) return 'N/A';
      return new Date(isoString).toLocaleString();
  }


  // --- Lifecycle ---
  onMount(async () => {
    await loadContacts();
    // Optionally select the first contact or handle no selection
    // if (contacts.length > 0) {
    //   handleSelectContact(contacts[0]);
    // }
  });

</script>

<div class="contacts-view">
  <!-- Left Panel: Contacts -->
  <div class="panel contacts-panel">
    <div class="panel-header">
        <h3>Contacts</h3>
        <button on:click={openNewContactForm}>+ New Contact</button>
    </div>
    <div class="filter-bar">
        <label for="relationship-filter">Filter by type:</label>
        <select id="relationship-filter" bind:value={selectedRelationshipTypeFilter} on:change={handleFilterChange}>
            <option value="">All Types</option>
            {#each relationshipTypes as type (type)}
                <option value={type}>{type}</option>
            {/each}
        </select>
    </div>
    <ul>
      {#each contacts as contact (contact.id)}
        <li class:selected={selectedContact?.id === contact.id} on:click={() => handleSelectContact(contact)}>
          {contact.name}
          <small>{contact.relationshipType || 'N/A'}</small>
          <small>Last contacted: {formatDate(contact.lastContactedDate)}</small>
        </li>
      {:else}
        <li>No contacts found.</li>
      {/each}
    </ul>
  </div>

  <!-- Right Panel: Details & Interactions -->
  <div class="panel details-panel">
    {#if selectedContact}
      <div class="contact-details-header">
        <h3>{selectedContact.name}</h3>
        <div class="contact-actions">
            <button class="edit-btn" on:click={() => openEditContactForm(selectedContact)}>Edit Contact</button>
            <button class="delete-btn" on:click={deleteSelectedContact}>Delete Contact</button>
        </div>
      </div>
      <div class="contact-info">
        <p><strong>Email:</strong> {selectedContact.email || 'N/A'}</p>
        <p><strong>Phone:</strong> {selectedContact.phone || 'N/A'}</p>
        <p><strong>Relationship:</strong> {selectedContact.relationshipType || 'N/A'}</p>
        <p><strong>Birthday:</strong> {selectedContact.birthday || 'N/A'}</p>
        <p><strong>Company:</strong> {selectedContact.company || 'N/A'} ({selectedContact.role || 'N/A'})</p>
        <p><strong>Comm. Frequency:</strong> {selectedContact.communicationFrequency || 'N/A'}</p>
        <p><strong>Notes:</strong> {selectedContact.notes || 'N/A'}</p>
        <p><strong>Tags:</strong> {selectedContact.tags?.join(', ') || 'None'}</p>
      </div>

      <h4>Interactions with {selectedContact.name}</h4>
      <button on:click={openNewInteractionForm}>+ Log Interaction</button>
      <ul class="interaction-list">
        {#each interactionsForSelectedContact as interaction (interaction.id)}
          <li class="interaction-item">
            <strong>{interaction.type}</strong> - {formatDate(interaction.date)}
            <p>{interaction.description}</p>
            {#if interaction.keyTakeaways}<p><em>Takeaways:</em> {interaction.keyTakeaways}</p>{/if}
            {#if interaction.followUpActions}<p><em>Follow-up:</em> {interaction.followUpActions}</p>{/if}
            {#if interaction.sentiment}<p><em>Sentiment:</em> {interaction.sentiment}</p>{/if}
            <div class="interaction-actions">
                <button class="edit-btn" on:click={() => openEditInteractionForm(interaction)}>Edit</button>
                <button class="delete-btn" on:click={() => deleteInteraction(interaction.id)}>Del</button>
            </div>
          </li>
        {:else}
          <li>No interactions logged yet for this contact.</li>
        {/each}
      </ul>
    {:else}
      <p class="empty-state">Select a contact to view details and interactions, or add a new contact.</p>
    {/if}
  </div>

  <!-- Contact Form Modal -->
  {#if showContactForm}
    <div class="modal-overlay" on:click|self={() => showContactForm = false}>
      <div class="modal-content contact-form">
        <h4>{editingContact ? 'Edit Contact' : 'New Contact'}</h4>
        <label>Name*: <input type="text" bind:value={contactForm.name} /></label>
        <label>Email: <input type="email" bind:value={contactForm.email} /></label>
        <label>Phone: <input type="tel" bind:value={contactForm.phone} /></label>
        <label>Address: <input type="text" bind:value={contactForm.address} /></label>
        <label>Company: <input type="text" bind:value={contactForm.company} /></label>
        <label>Role: <input type="text" bind:value={contactForm.role} /></label>
        <label>Birthday: <input type="date" bind:value={contactForm.birthday} /></label>
        <label>Relationship Type: <input type="text" list="relTypes" bind:value={contactForm.relationshipType} />
            <datalist id="relTypes">
                {#each ['Friend', 'Family', 'Colleague', 'Mentor', 'Acquaintance', 'Network', 'Lead', 'Client'] as type} <option value={type}>{type}</option> {/each}
            </datalist>
        </label>
        <label>Communication Frequency: <input type="text" list="commFreq" bind:value={contactForm.communicationFrequency} />
            <datalist id="commFreq">
                 {#each ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Annually', 'As Needed'] as freq} <option value={freq}>{freq}</option> {/each}
            </datalist>
        </label>
        <label>Tags (comma-separated): <input type="text" bind:value={contactForm.tags} on:input={(e) => contactForm.tags = e.currentTarget.value.split(',').map(t => t.trim())} /></label>
        <label>Notes: <textarea bind:value={contactForm.notes}></textarea></label>
        <div class="form-actions">
            <button on:click={saveContact}>Save Contact</button>
            <button class="cancel-btn" on:click={() => showContactForm = false}>Cancel</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Interaction Form Modal -->
  {#if showInteractionForm && selectedContact}
    <div class="modal-overlay" on:click|self={() => showInteractionForm = false}>
      <div class="modal-content interaction-form">
        <h4>{editingInteraction ? 'Edit Interaction' : `Log Interaction with ${selectedContact.name}`}</h4>
        <label>Date & Time*: <input type="datetime-local" bind:value={interactionForm.date} /></label>
        <label>Type*:
          <select bind:value={interactionForm.type}>
            {#each InteractionTypeARR as typeValue}
              <option value={typeValue}>{typeValue}</option>
            {/each}
          </select>
        </label>
        <label>Description*: <textarea bind:value={interactionForm.description} rows="3"></textarea></label>
        <label>Key Takeaways: <textarea bind:value={interactionForm.keyTakeaways} rows="2"></textarea></label>
        <label>Follow-up Actions: <textarea bind:value={interactionForm.followUpActions} rows="2"></textarea></label>
        <label>Sentiment:
          <select bind:value={interactionForm.sentiment}>
            <option value={undefined}>-- Optional --</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>
        </label>
        <div class="form-actions">
            <button on:click={saveInteraction}>Save Interaction</button>
            <button class="cancel-btn" on:click={() => showInteractionForm = false}>Cancel</button>
        </div>
      </div>
    </div>
  {/if}

</div>

<style>
  .contacts-view { display: flex; height: calc(100vh - 50px); font-family: sans-serif; }
  .panel { padding: 10px; border: 1px solid #ccc; overflow-y: auto; }
  .contacts-panel { width: 35%; min-width: 250px; margin-right: 10px; }
  .details-panel { width: 65%; }
  .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .filter-bar { margin-bottom: 10px; }
  .filter-bar label { margin-right: 5px; }
  .contacts-panel ul, .interaction-list { list-style: none; padding: 0; }
  .contacts-panel li { padding: 8px; margin-bottom: 5px; border-radius: 3px; cursor: pointer; border: 1px solid #eee; }
  .contacts-panel li:hover { background-color: #f0f0f0; }
  .contacts-panel li.selected { background-color: #e0e8ff; border-left: 3px solid #007bff; }
  .contacts-panel li small { display: block; font-size: 0.8em; color: #777; }
  
  .contact-details-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px;}
  .contact-info p { margin: 4px 0; font-size: 0.9em; }
  .contact-info strong { color: #333; }
  
  .interaction-item { background-color: #f9f9f9; border: 1px solid #e7e7e7; padding: 10px; margin-bottom: 8px; border-radius: 4px; }
  .interaction-item strong { font-size: 1.05em; }
  .interaction-item p { margin: 4px 0; font-size: 0.9em; }
  .interaction-item em { color: #555; }
  .interaction-actions, .contact-actions { margin-top: 5px; text-align: right; }
  .interaction-actions button, .contact-actions button { font-size: 0.8em; padding: 3px 7px; margin-left: 5px; }
  .edit-btn { background-color: #ffc107; border:none; border-radius:3px; }
  .delete-btn { background-color: #dc3545; color: white; border:none; border-radius:3px; }
  .cancel-btn { background-color: #6c757d; color: white; border:none; border-radius:3px; }
  
  .empty-state { color: #777; text-align: center; margin-top: 20px; padding: 15px; }

  .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
  .modal-content { background-color: white; padding: 20px; border-radius: 5px; min-width: 400px; max-width: 600px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  .modal-content h4 { margin-top: 0; }
  .modal-content label { display: block; margin-bottom: 3px; font-weight: bold; font-size: 0.9em; }
  .modal-content input[type="text"],
  .modal-content input[type="email"],
  .modal-content input[type="tel"],
  .modal-content input[type="date"],
  .modal-content input[type="datetime-local"],
  .modal-content textarea,
  .modal-content select {
    width: 100%; /* Full width */
    padding: 8px;
    margin-bottom: 10px;
    border: 1px solid #ccc;
    border-radius: 3px;
    box-sizing: border-box;
  }
   .form-actions { margin-top: 15px; text-align: right; }
   .form-actions button { margin-left: 10px; padding: 8px 15px; }
</style>
