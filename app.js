// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDgAa20R3OYGTkFNmlWuLCMR8gROq-Uzxk',
  authDomain: 'tradeprotectrx-5457c.firebaseapp.com',
  projectId: 'tradeprotectrx-5457c',
  storageBucket: 'tradeprotectrx-5457c.appspot.com',
  messagingSenderId: '1009491320803',
  appId: '1:1009491320803:web:9c93454b3a4efa95a0e0ff',
  measurementId: 'G-FW0YC1KTZQ'
};

// Initialize Firebase with error handling
if (typeof firebase !== 'undefined') {
  try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');

    // Initialize Firebase services
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage ? firebase.storage() : null;



    // Login functionality
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        auth.signInWithEmailAndPassword(email, password)
          .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            console.log('User signed in:', user);
            window.location.href = 'dashboard.html';
          })
          .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Login error:', errorCode, errorMessage);
            document.getElementById('errorMessage').textContent = errorMessage;
          });
      });
    }

    // Logout functionality
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
          console.log('User signed out');
          window.location.href = 'index.html';
        }).catch((error) => {
          console.error('Logout error:', error);
        });
      });
    }

    // Check auth state
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('User is signed in');
        // Load dashboard components if on dashboard page
        if (window.location.pathname.includes('dashboard.html')) {
          loadOrders();
          loadArchivedOrders();
          setupForms();
          loadWhitelist();
          loadCompanies();
        }
      } else {
        console.log('No user is signed in');
      }
    });



    // Orders
    function loadOrders(sortBy = 'date') {
      console.log('Loading active orders...');
      const ordersContainer = document.getElementById('activeOrdersList');
      if (ordersContainer) {
        console.log('Active orders container found');
        let query = db.collection('orders').where('archived', '==', false);

        if (sortBy === 'date') {
          query = query.orderBy('timestamp', 'desc');
        } else if (sortBy === 'company') {
          query = query.orderBy('information.companyName');
        }

        query.get()
          .then((querySnapshot) => {
            console.log('Query snapshot:', querySnapshot);
            ordersContainer.innerHTML = '';
            if (querySnapshot.empty) {
              console.log('No active orders found');
              ordersContainer.innerHTML = '<p>No active orders found.</p>';
            } else {
              console.log('Active orders found:', querySnapshot.size);
           
              querySnapshot.forEach((doc) => {
                const order = doc.data();
                console.log('Order data:', order);
                const orderElement = document.createElement('div');
                const orderDate = order.timestamp ? new Date(order.timestamp.toDate()).toLocaleString() : 'N/A';
                orderElement.classList.add('card', 'mb-3');

                orderElement.innerHTML = `
                <div class='card-body'>
                  <h5 class='card-title'>Order #${doc.id}</h5>
                  <p>Status: 
                    <select class='status-select' data-order-id='${doc.id}'>
                      <option value='unread' ${order.status === 'unread' ? 'selected' : ''}>Unread</option>
                      <option value='read' ${order.status === 'read' ? 'selected' : ''}>Read</option>
                    </select>
                  </p>
                  <p>Date: ${orderDate || 'N/A'}</p>
                  <p>Email: ${order.information["email"] || 'N/A'}</p>
                  <p>Employee Name: ${order.information["Employee name"] || 'N/A'}</p>
                  <p>Employee ID: ${order.information["Employee ID"] || 'N/A'}</p>
                  <p>Email: ${order.information["email"] || 'N/A'}</p>
                  <p>Phone: ${order.information["phoneNumber"] || 'N/A'}</p>
                  <p>Company: ${order.information["companyName"] || 'N/A'}</p>
                  <p>Frame: ${order.frameName || 'N/A'}</p>
                  <p>Monocular PD Left: ${order.information["Monocular PD Left"] || 'N/A'}</p>
                  <p>Monocular PD Right: ${order.information["Monocular PD Right"] || 'N/A'}</p>
                  <p>OC/seg: ${order.information["OC/ seg"] || 'N/A'}</p>
                  <p>Lenses: ${order.lenses ? order.lenses.join(', ') : 'N/A'}</p>
                  <h6>Prescription Images:</h6>
                  <div class='prescription-images'></div>
                  <h6>Frame Image:</h6>
                  <div class='frame-image'></div>
                  <h6>Add-ons:</h6>
              <ul>
      ${order.transitions 
        ? Object.entries(order.transitions).map(([name, value]) => `
          <li>${name}: ${value}</li>`).join('')
        : '<li>N/A</li>'}
    </ul>
                  <button class='btn btn-warning archive-btn' data-order-id='${doc.id}'>Archive</button>
                  <button class='btn btn-danger delete-btn' data-order-id='${doc.id}'>Delete</button>
                </div>
              `;
              
                
                // Add prescription images
                const prescriptionImagesContainer = orderElement.querySelector('.prescription-images');
                if (order.imageUrls && order.imageUrls.length > 0) {
                  order.imageUrls.forEach(url => {
                    const imgElement = createImageElement(url, 'Prescription Image');
                    prescriptionImagesContainer.appendChild(imgElement);
                  });
                } else {
                  prescriptionImagesContainer.textContent = 'No prescription images';
                }

                // Add frame image
                const frameImageContainer = orderElement.querySelector('.frame-image');
                if (order.frameImage) {
                  const imgElement = createImageElement(order.frameImage, 'Frame Image');
                  frameImageContainer.appendChild(imgElement);
                } else {
                  frameImageContainer.textContent = 'No frame image';
                }

                ordersContainer.appendChild(orderElement);
              });

              // Add event listeners for status change, archive, and delete
              document.querySelectorAll('.status-select').forEach(select => {
                select.addEventListener('change', (e) => updateOrderStatus(e.target.dataset.orderId, e.target.value));
              });
              document.querySelectorAll('.archive-btn').forEach(btn => {
                btn.addEventListener('click', (e) => archiveOrder(e.target.dataset.orderId));
              });
              document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => deleteOrder(e.target.dataset.orderId));
              });
            }
          })
          .catch((error) => {
            console.error('Error loading active orders:', error);
            ordersContainer.innerHTML = `<p>Error loading active orders: ${error.message}. Please try again later.</p>`;
          });
      } else {
        console.error('Active orders container not found');
      }
    }

    function updateOrderStatus(orderId, newStatus) {
      db.collection('orders').doc(orderId).update({ status: newStatus })
        .then(() => {
          console.log('Order status updated');
          loadOrders();
        })
        .catch((error) => console.error('Error updating order status:', error));
    }

    function archiveOrder(orderId) {
      db.collection('orders').doc(orderId).update({ archived: true })
        .then(() => {
          console.log('Order archived');
          loadOrders();
          loadArchivedOrders();
        })
        .catch((error) => console.error('Error archiving order:', error));
    }

    function deleteOrder(orderId) {
      if (confirm('Are you sure you want to delete this order?')) {
        db.collection('orders').doc(orderId).delete()
          .then(() => {
            console.log('Order deleted');
            loadOrders();
          })
          .catch((error) => console.error('Error deleting order:', error));
      }
    }

    function openImageModal(imageUrl) {
      console.log('Opening image modal for:', imageUrl);
      const modal = document.createElement('div');
      modal.classList.add('modal', 'fade');
      modal.innerHTML = `
        <div class='modal-dialog modal-lg'>
          <div class='modal-content'>
            <div class='modal-body'>
              <img src='${imageUrl}' class='img-fluid' alt='Enlarged Image'>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      try {
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        modal.addEventListener('hidden.bs.modal', function () {
          document.body.removeChild(modal);
        });
      } catch (error) {
        console.error('Error initializing modal:', error);
        alert('There was an error opening the image. Please try again.');
        document.body.removeChild(modal);
      }
    }

    function createImageElement(url, altText) {
      const imgElement = document.createElement('img');
      imgElement.src = url;
      imgElement.alt = altText;
      imgElement.classList.add('img-thumbnail', 'prescription-image');
      imgElement.style.maxWidth = '100px';
      imgElement.style.cursor = 'pointer';
      imgElement.addEventListener('click', () => openImageModal(url));
      return imgElement;
    }

    function loadArchivedOrders(sortBy = 'date') {
      console.log('Loading archived orders...');
      const archivedOrdersContainer = document.getElementById('archivedOrdersList');
      if (archivedOrdersContainer) {
        console.log('Archived orders container found');
        let query = db.collection('orders').where('archived', '==', true);

        if (sortBy === 'date') {
          query = query.orderBy('timestamp', 'desc');
        } else if (sortBy === 'company') {
          query = query.orderBy('information.companyName');
        }

        query.get()
          .then((querySnapshot) => {
            console.log('Archived query snapshot:', querySnapshot);
            archivedOrdersContainer.innerHTML = '';
            if (querySnapshot.empty) {
              console.log('No archived orders found');
              archivedOrdersContainer.innerHTML = '<p>No archived orders found.</p>';
            } else {
              console.log('Archived orders found:', querySnapshot.size);
              querySnapshot.forEach((doc) => {
                const order = doc.data();
                const orderDate = order.timestamp ? new Date(order.timestamp.toDate()).toLocaleString() : 'N/A';
                console.log('Archived order data:', order);
                const orderElement = document.createElement('div');
                orderElement.classList.add('card', 'mb-3');
                orderElement.innerHTML = `
               <div class='card-body'>
    <h5 class='card-title'>Order #${doc.id}</h5>
    <p>Status: 
      <select class='status-select' data-order-id='${doc.id}'>
        <option value='unread' ${order.status === 'unread' ? 'selected' : ''}>Unread</option>
        <option value='read' ${order.status === 'read' ? 'selected' : ''}>Read</option>
      </select>
    </p>
    <p>Date: ${orderDate || 'N/A'}</p>
    <p>Email: ${order.information["email"] || 'N/A'}</p>
    <p>Employee Name: ${order.information["Employee name"] || 'N/A'}</p>
    <p>Employee ID: ${order.information["Employee ID"] || 'N/A'}</p>
    <p>Email: ${order.information["email"] || 'N/A'}</p>
    <p>Phone: ${order.information["phoneNumber"] || 'N/A'}</p>
    <p>Company: ${order.information["companyName"] || 'N/A'}</p>
    <p>Frame: ${order.frameName || 'N/A'}</p>
    <p>Monocular PD Left: ${order.information["Monocular PD Left"] || 'N/A'}</p>
    <p>Monocular PD Right: ${order.information["Monocular PD Right"] || 'N/A'}</p>
    <p>OC/seg: ${order.information["OC/ seg"] || 'N/A'}</p>
    <p>Lenses: ${order.lenses ? order.lenses.join(', ') : 'N/A'}</p>
    <h6>Prescription Images:</h6>
    <div class='prescription-images'></div>
    <h6>Frame Image:</h6>
    <div class='frame-image'></div>
    <h6>Add-ons:</h6>
    <ul>
      ${order.transitions 
        ? Object.entries(order.transitions).map(([name, value]) => `
          <li>${name}: ${value}</li>`).join('')
        : '<li>N/A</li>'}
    </ul>
                    <button class='btn btn-primary unarchive-btn' data-order-id='${doc.id}'>Unarchive</button>
                  </div>
                `;

                // Add prescription images
                const prescriptionImagesContainer = orderElement.querySelector('.prescription-images');
                if (order.imageUrls && order.imageUrls.length > 0) {
                  order.imageUrls.forEach(url => {
                    const imgElement = createImageElement(url, 'Prescription Image');
                    prescriptionImagesContainer.appendChild(imgElement);
                  });
                } else {
                  prescriptionImagesContainer.textContent = 'No prescription images';
                }

                // Add frame image
                const frameImageContainer = orderElement.querySelector('.frame-image');
                if (order.frameImage) {
                  const imgElement = createImageElement(order.frameImage, 'Frame Image');
                  frameImageContainer.appendChild(imgElement);
                } else {
                  frameImageContainer.textContent = 'No frame image';
                }

                archivedOrdersContainer.appendChild(orderElement);
              });

              // Add event listener for unarchive button
              document.querySelectorAll('.unarchive-btn').forEach(btn => {
                btn.addEventListener('click', (e) => unarchiveOrder(e.target.dataset.orderId));
              });
            }
          })
          .catch((error) => {
            console.error('Error loading archived orders:', error);
            archivedOrdersContainer.innerHTML = `<p>Error loading archived orders: ${error.message}. Please try again later.</p>`;
          });
      } else {
        console.error('Archived orders container not found');
      }
    }

    function unarchiveOrder(orderId) {
      db.collection('orders').doc(orderId).update({ archived: false })
        .then(() => {
          console.log('Order unarchived');
          loadArchivedOrders();
          loadOrders();
        })
        .catch((error) => console.error('Error unarchiving order:', error));
    }

    function setupForms() {
      setupAddItemForm();
      setupAddWhitelistForm();
      setupAddCompanyForm();
      setupSortingForms();
    }


    function updateLayoutOrderDirectly(event, collectionName) {
      const input = event.target;
      const itemId = input.dataset.id;
      const newOrder = parseInt(input.value, 10);
    
      if (isNaN(newOrder)) {
        alert('Please enter a valid number for layout order.');
        return;
      }
    
      db.collection(collectionName)
        .doc(itemId)
        .update({ layoutOrder: newOrder })
        .then(() => {
          console.log(`Layout order for item ${itemId} updated to ${newOrder}`);
          loadItems(); // Reload items to reflect the new order
        })
        .catch((error) => {
          console.error('Error updating layout order:', error);
        });
    }
    
    

    
    function loadItems() {
      const itemType = document.getElementById('itemType').value;
      const itemsContainer = document.getElementById('framesList'); // Assuming #framesList is used for frames
      const collectionName = itemType + 's';
    
      if (itemsContainer) {
        itemsContainer.innerHTML = '<p>Loading...</p>';
    
        db.collection(collectionName)
          .orderBy(itemType === 'frame' ? 'layoutOrder' : 'name') // Use layoutOrder only for frames
          .get()
          .then((querySnapshot) => {
            itemsContainer.innerHTML = ''; // Clear existing content
            if (querySnapshot.empty) {
              itemsContainer.innerHTML = `<p>No ${itemType}s found.</p>`;
            } else {
              querySnapshot.forEach((doc) => {
                const item = doc.data();
                const listItem = document.createElement('li');
                listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
                listItem.setAttribute('data-id', doc.id);
    
                // Include layout order functionality only for frames
                if (itemType === 'frame') {
                  listItem.innerHTML = `
                    <div class="d-flex align-items-center">
                      ${
                        item.image
                          ? `<img src="${item.image}" alt="${item.name}" class="img-thumbnail me-3" style="max-width: 100px; height: auto;">`
                          : ''
                      }
                      <span>${item.name}</span>
                    </div>
                    <div class="d-flex align-items-center">
                      <input type="number" class="form-control form-control-sm layout-order-input me-2" value="${item.layoutOrder}" data-id="${doc.id}" style="width: 80px;">
                      <button class="btn btn-sm btn-primary edit-item" data-id="${doc.id}">Edit</button>
                      <button class="btn btn-sm btn-danger delete-item ms-2" data-id="${doc.id}">Delete</button>
                    </div>
                  `;
                } else {
                  // Default behavior for non-frame items
                  listItem.innerHTML = `
                    <div class="d-flex align-items-center">
                      ${
                        item.image
                          ? `<img src="${item.image}" alt="${item.name}" class="img-thumbnail me-3" style="max-width: 100px; height: auto;">`
                          : ''
                      }
                      <span>${item.name}</span>
                    </div>
                    <div class="d-flex align-items-center">
                      <button class="btn btn-sm btn-primary edit-item" data-id="${doc.id}">Edit</button>
                      <button class="btn btn-sm btn-danger delete-item ms-2" data-id="${doc.id}">Delete</button>
                    </div>
                  `;
                }
    
                itemsContainer.appendChild(listItem);
              });
    
              // Attach event listeners only for frames
              if (itemType === 'frame') {
                itemsContainer.querySelectorAll('.layout-order-input').forEach((input) =>
                  input.addEventListener('change', (e) => updateLayoutOrderDirectly(e, collectionName))
                );
              }
    
              // Attach event listeners for edit and delete buttons
              itemsContainer.querySelectorAll('.edit-item').forEach((button) =>
                button.addEventListener('click', (e) => editItem(e.target.dataset.id, collectionName))
              );
              itemsContainer.querySelectorAll('.delete-item').forEach((button) =>
                button.addEventListener('click', (e) => deleteItem(e.target.dataset.id, collectionName))
              );
            }
          })
          .catch((error) => {
            console.error(`Error loading ${itemType}s:`, error);
            itemsContainer.innerHTML = `<p>Error loading ${itemType}s. Please try again later.</p>`;
          });
      }
    }
    
    
  
  

  function addWhitelistCompany(addonId, companyName) {
    const addonRef = db.collection('addons').doc(addonId);
    addonRef.update({
        whitelist: firebase.firestore.FieldValue.arrayUnion(companyName)
    }).then(() => {
        console.log(`Company ${companyName} added to whitelist.`);
        editItem(addonId, 'addons'); // Reload modal
    }).catch((error) => {
        console.error('Error adding company to whitelist:', error);
    });
}


function removeWhitelistCompany(addonId, companyName) {
  const addonRef = db.collection('addons').doc(addonId);
  addonRef.update({
      whitelist: firebase.firestore.FieldValue.arrayRemove(companyName)
  }).then(() => {
      console.log(`Company ${companyName} removed from whitelist.`);
      editItem(addonId, 'addons'); // Reload modal
  }).catch((error) => {
      console.error('Error removing company from whitelist:', error);
  });
}




function editItem(id, collectionName) {
  console.log('Edit item:', id, 'in collection:', collectionName);

  // Remove any existing modal
  const existingModal = document.getElementById('editItemModal');
  if (existingModal) {
      existingModal.remove();
  }

  db.collection(collectionName).doc(id).get()
      .then((doc) => {
          if (doc.exists) {
              const item = doc.data();

              // Modal HTML structure
              const modalHtml = `
                  <div class="modal fade" id="editItemModal" tabindex="-1" aria-labelledby="editItemModalLabel" aria-hidden="true">
                      <div class="modal-dialog">
                          <div class="modal-content">
                              <div class="modal-header">
                                  <h5 class="modal-title" id="editItemModalLabel">Edit ${collectionName.slice(0, -1)}</h5>
                                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                              </div>
                              <div class="modal-body">
                                  <form id="editItemForm">
                                      <input type="hidden" id="editItemId" value="${id}">
                                      <input type="hidden" id="editItemCollection" value="${collectionName}">
                                      <div class="mb-3">
                                          <label for="editItemName" class="form-label">Name</label>
                                          <input type="text" class="form-control" id="editItemName" value="${item.name}" required>
                                      </div>
                                      ${
                                          collectionName !== 'addons'
                                              ? `<div class="mb-3">
                                                    <label for="editItemPrice" class="form-label">Price</label>
                                                    <input type="number" class="form-control" id="editItemPrice" value="${item.price || ''}" step="0.01" min="0">
                                                </div>`
                                              : ''
                                      }
                                      ${
                                          collectionName === 'frames'
                                              ? `<div class="mb-3">
                                                    <label for="editFrameImage" class="form-label">Frame Image</label>
                                                    <img src="${item.image || ''}" alt="Current Frame Image" class="img-thumbnail mb-2" style="max-width: 200px;"/>
                                                    <input type="file" class="form-control" id="editFrameImage" accept="image/*">
                                                </div>`
                                              : ''
                                      }
                                      <div id="modalFields">
                                          <!-- Dynamic fields dynamically inserted here -->
                                      </div>
                                      <button type="submit" class="btn btn-primary">Save changes</button>
                                  </form>
                              </div>
                          </div>
                      </div>
                  </div>
              `;

              // Append modal to body
              document.body.insertAdjacentHTML('beforeend', modalHtml);
              const modalElement = document.getElementById('editItemModal');
              const modal = new bootstrap.Modal(modalElement);
              modal.show();

              // Addon-specific whitelist and options handling
              if (collectionName === 'addons') {
                  db.collection('companies').get().then((querySnapshot) => {
                      const companyOptions = querySnapshot.docs.map((doc) => doc.data().name);
                      companyOptions.unshift("All");
                      const companyDropdown = `
                          <div class="mb-3">
                              <h6>Whitelist</h6>
                              <ul id="whitelistCompanies" class="list-group mb-3">
                                  ${(item.whitelist || []).map((company) => `
                                      <li class="list-group-item d-flex justify-content-between align-items-center">
                                          ${company}
                                          <button class="btn btn-sm btn-danger remove-whitelist" data-company="${company}">Remove</button>
                                      </li>
                                  `).join('')}
                              </ul>
                              <div class="input-group">
                                  <select id="newWhitelistCompany" class="form-select">
                                      <option value="" disabled selected>Select a company</option>
                                      ${companyOptions.map((company) => `<option value="${company}">${company}</option>`).join('')}
                                  </select>
                                  <button class="btn btn-primary" id="addWhitelistCompany">Add</button>
                              </div>
                          </div>
                          <div class="mb-3">
                              <label for="editAddonOption1" class="form-label">Option 1</label>
                              <input type="text" class="form-control" id="editAddonOption1" value="${item.option1 || ''}">
                          </div>
                          <div class="mb-3">
                              <label for="editAddonOption2" class="form-label">Option 2</label>
                              <input type="text" class="form-control" id="editAddonOption2" value="${item.option2 || ''}">
                          </div>
                      `;
                      document.getElementById('modalFields').innerHTML = companyDropdown;

                      // Add company to whitelist
                      document.getElementById('addWhitelistCompany').addEventListener('click', () => {
                          const newCompany = document.getElementById('newWhitelistCompany').value;
                          if (newCompany) {
                              addWhitelistCompany(id, newCompany);
                          }
                      });

                      // Remove company from whitelist
                      document.querySelectorAll('.remove-whitelist').forEach((button) => {
                          button.addEventListener('click', () => {
                              const companyToRemove = button.getAttribute('data-company');
                              removeWhitelistCompany(id, companyToRemove);
                          });
                      });
                  });
              }

              // Add event listener for form submission
              document.getElementById('editItemForm').addEventListener('submit', async (e) => {
                  e.preventDefault();
                  await updateItem(e);
                  modal.hide(); // Hide the modal
              });

              // Cleanup modal on hidden event
              modalElement.addEventListener('hidden.bs.modal', () => {
                  modalElement.remove(); // Remove the modal element
                  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.remove());
                  document.body.classList.remove('modal-open');
                  document.body.style = '';
              });
          } else {
              console.error('No such document!');
          }
      })
      .catch((error) => {
          console.error('Error getting document:', error);
      });
}


async function updateItem(e) {
  e.preventDefault();
  const id = document.getElementById('editItemId').value;
  const collectionName = document.getElementById('editItemCollection').value;
  const name = document.getElementById('editItemName').value;

  let updateData = { name };

  if (collectionName === 'addons') {
      const option1 = document.getElementById('editAddonOption1').value;
      const option2 = document.getElementById('editAddonOption2').value;
      updateData.option1 = option1 || null;
      updateData.option2 = option2 || null;
  }

  if (collectionName !== 'addons') {
      const priceElement = document.getElementById('editItemPrice');
      if (priceElement) {
          const price = parseFloat(priceElement.value);
          if (!isNaN(price)) updateData.price = price;
      }
  }

  if (collectionName === 'frames') {
      const imageFile = document.getElementById('editFrameImage')?.files[0];
      if (imageFile) {
          const imageUrl = await uploadImage(imageFile);
          updateData.image = imageUrl;
      }
  }

  db.collection(collectionName).doc(id).update(updateData)
      .then(() => {
          console.log("Document successfully updated!");
          bootstrap.Modal.getInstance(document.getElementById('editItemModal')).hide();
          document.getElementById('editItemModal').remove();
          loadItems(); // Reload items to reflect changes
      })
      .catch((error) => {
          console.error("Error updating document: ", error);
      });
}



    function deleteItem(id, collectionName) {
      if (confirm('Are you sure you want to delete this item?')) {
        db.collection(collectionName).doc(id).delete()
          .then(() => {
            console.log('Item deleted');
            loadItems();
          })
          .catch((error) => {
            console.error('Error deleting item:', error);
          });
      }
    }

    function setupAddItemForm() {
      const itemTypeSelect = document.getElementById('itemType');
      const addonFields = document.getElementById('addonFields');
      const frameImageUpload = document.getElementById('frameImageUpload');
      const priceInput = document.getElementById('priceInput'); // Reference to the price field
  
      function updateFields() {
          const selectedType = itemTypeSelect.value;
          addonFields.style.display = selectedType === 'addon' ? 'block' : 'none';
          frameImageUpload.style.display = selectedType === 'frame' ? 'block' : 'none';
          priceInput.style.display = (selectedType === 'frame' || selectedType === 'lense') ? 'block' : 'none';
  
          // Clear values of hidden fields to avoid validation errors
          if (selectedType !== 'addon') {
              document.getElementById('addonOption1').value = '';
              document.getElementById('addonOption2').value = '';
          }
          if (selectedType !== 'frame' && selectedType !== 'lense') {
              document.getElementById('itemPrice').value = '';
          }
          loadItems();
      }
  
      // Update fields on item type change
      itemTypeSelect.addEventListener('change', updateFields);
  
      // Initialize fields on page load
      updateFields();
  
      const addItemForm = document.getElementById('addItemForm');
      if (addItemForm) {
          addItemForm.addEventListener('submit', async (e) => {
              e.preventDefault();
  
              const itemType = itemTypeSelect.value;
              const itemName = document.getElementById('itemName').value;
              const itemPrice = document.getElementById('itemPrice').value || null;
  
              let itemData = { name: itemName };
              if (itemPrice !== null) itemData.price = parseFloat(itemPrice);
  
              if (itemType === 'addon') {
                  const option1 = document.getElementById('addonOption1').value;
                  const option2 = document.getElementById('addonOption2').value;
                  itemData.option1 = option1 || null;
                  itemData.option2 = option2 || null;
              } else if (itemType === 'frame') {
                  const imageFile = document.getElementById('frameImage').files[0];
                  if (imageFile) {
                      itemData.image = await uploadImage(imageFile);
                  }
              }
  
              db.collection(itemType + 's').add(itemData)
                  .then(() => {
                      console.log(`${itemType} added successfully`);
                      loadItems();
                  })
                  .catch((error) => {
                      console.error('Error adding item:', error);
                  });
          });
      }
  }
  
  
  




    

    function addItem(itemType, itemName, itemPrice, imageUrl = null) {
      const collectionName = itemType + 's';
      const itemData = {
        name: itemName,
        price: itemPrice,
        layoutOrder: Date.now(),

      };

      if (itemType === 'frame' && imageUrl) {
        itemData.image = imageUrl;
      }

      return db.collection(collectionName).add(itemData);
    }

    async function uploadImage(file) {
      const storageRef = storage.ref();
      const imageRef = storageRef.child(`frames/${file.name}`);
      await imageRef.put(file);
      return await imageRef.getDownloadURL();
    }

    function loadWhitelist() {
      console.log('Loading whitelist...');
      const whitelistedEmailsContainer = document.getElementById('whitelistedEmails');
      if (whitelistedEmailsContainer) {
        db.collection('whitelist').get()
          .then((querySnapshot) => {
            whitelistedEmailsContainer.innerHTML = '';
            if (querySnapshot.empty) {
              whitelistedEmailsContainer.innerHTML = '<p>No whitelisted emails found.</p>';
            } else {
              querySnapshot.forEach((doc) => {
                const email = doc.data().email;
                const listItem = document.createElement('li');
                listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
                listItem.innerHTML = `
                  ${email}
                  <button class="btn btn-danger btn-sm delete-whitelist" data-id="${doc.id}">Delete</button>
                `;
                whitelistedEmailsContainer.appendChild(listItem);
              });
              document.querySelectorAll('.delete-whitelist').forEach(btn => {
                btn.addEventListener('click', (e) => deleteWhitelistEntry(e.target.dataset.id));
              });
            }
          })
          .catch((error) => {
            console.error("Error loading whitelist: ", error);
            whitelistedEmailsContainer.innerHTML = '<p>Error loading whitelist. Please try again later.</p>';
          });
      } else {
        console.error("Whitelisted emails container not found");
      }
    }

    function addToWhitelist(email) {
      db.collection('whitelist').add({
        email: email
      })
      .then(() => {
        console.log('Email added to whitelist');
        loadWhitelist();
      })
      .catch((error) => {
        console.error('Error adding email to whitelist:', error);
      });
    }

    function deleteWhitelistEntry(id) {
      if (confirm('Are you sure you want to delete this whitelist entry?')) {
        db.collection('whitelist').doc(id).delete()
          .then(() => {
            console.log('Whitelist entry deleted');
            loadWhitelist();
          })
          .catch((error) => {
            console.error('Error deleting whitelist entry:', error);
          });
      }
    }

    function setupAddWhitelistForm() {
      const addWhitelistForm = document.getElementById('addWhitelistForm');
      if (addWhitelistForm) {
        addWhitelistForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const email = document.getElementById('newWhitelistEmail').value;
          addToWhitelist(email);
          addWhitelistForm.reset();
        });
      }
    }

    function loadCompanies() {
      const companiesList = document.getElementById('companiesList');
      if (companiesList) {
          companiesList.innerHTML = '';
          db.collection('companies').get()
              .then((querySnapshot) => {
                  querySnapshot.forEach((doc) => {
                      const company = doc.data();
                      const listItem = document.createElement('li');
                      listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
                      listItem.innerHTML = `
                          <span>${company.name}</span>
                          <div>
                              <button class="btn btn-sm btn-primary edit-company" data-id="${doc.id}">Edit</button>
                              <button class="btn btn-sm btn-danger delete-company" data-id="${doc.id}">Delete</button>
                          </div>
                      `;
                      companiesList.appendChild(listItem);
                  });
  
                  // Add event listeners for edit and delete
                  document.querySelectorAll('.edit-company').forEach((button) => {
                      button.addEventListener('click', (e) => editCompany(e.target.dataset.id));
                  });

                  document.querySelectorAll('.delete-company').forEach((button) => {
                    button.addEventListener('click', (e) => deleteCompany(e.target.dataset.id));
                });



                  
              });
      }
  }
  
  function editCompany(companyId) {
      const companyRef = db.collection('companies').doc(companyId);
      companyRef.get().then((doc) => {
          if (doc.exists) {
              const company = doc.data();
              const newName = prompt('Enter the new name for the company:', company.name);
              if (newName && newName !== company.name) {
                  companyRef.update({ name: newName })
                      .then(() => {
                          console.log('Company updated successfully.');
                          loadCompanies();
                      })
                      .catch((error) => console.error('Error updating company:', error));
              }
          } else {
              console.error('No such document!');
          }
      }).catch((error) => console.error('Error fetching document:', error));
  }

    function addCompany(companyName) {
      db.collection('companies').add({
        name: companyName
      })
      .then(() => {
        console.log('Company added successfully');
        loadCompanies();
      })
      .catch((error) => {
        console.error('Error adding company:', error);
      });
    }

    function deleteCompany(id) {
      if (confirm('Are you sure you want to delete this company?')) {
        db.collection('companies').doc(id).delete()
          .then(() => {
            console.log('Company deleted');
            loadCompanies();
          })
          .catch((error) => {
            console.error('Error deleting company:', error);
          });
      }
    }

    function setupAddCompanyForm() {
      const addCompanyForm = document.getElementById('addCompanyForm');
      if (addCompanyForm) {
        addCompanyForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const companyName = document.getElementById('newCompanyName').value;
          addCompany(companyName);
          addCompanyForm.reset();
        });
      }
    }

    function setupSortingForms() {
      const activeOrdersSort = document.getElementById('activeOrdersSort');
      const archivedOrdersSort = document.getElementById('archivedOrdersSort');

      if (activeOrdersSort) {
        activeOrdersSort.addEventListener('change', (e) => {
          loadOrders(e.target.value);
        });
      }

      if (archivedOrdersSort) {
        archivedOrdersSort.addEventListener('change', (e) => {
          loadArchivedOrders(e.target.value);
        });
      }
    }

  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
} else {
  console.error('Firebase SDK not loaded. Please check if the SDK scripts are included correctly.');
}