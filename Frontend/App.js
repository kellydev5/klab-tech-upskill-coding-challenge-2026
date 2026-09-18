const API_BASE = "/tasks";

const state = {
  status: "",
  priority: "",
  search: "",
  page: 1,
  limit: 10,
  editingId: null,
};

const el = {
  taskList: document.getElementById("taskList"),
  loading: document.getElementById("loadingIndicator"),
  empty: document.getElementById("emptyState"),
  pagination: document.getElementById("pagination"),
  statusFilter: document.getElementById("statusFilter"),
  priorityFilter: document.getElementById("priorityFilter"),
  searchInput: document.getElementById("searchInput"),
  newTaskBtn: document.getElementById("newTaskBtn"),
  modal: document.getElementById("taskModal"),
  modalTitle: document.getElementById("modalTitle"),
  form: document.getElementById("taskForm"),
  taskId: document.getElementById("taskId"),
  titleInput: document.getElementById("titleInput"),
  titleError: document.getElementById("titleError"),
  descriptionInput: document.getElementById("descriptionInput"),
  priorityInput: document.getElementById("priorityInput"),
  statusInput: document.getElementById("statusInput"),
  cancelBtn: document.getElementById("cancelBtn"),
  toast: document.getElementById("toast"),
};

let searchDebounce;

function showToast(message, isError = false) {
  el.toast.textContent = message;
  el.toast.classList.remove("hidden", "error");
  if (isError) el.toast.classList.add("error");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.toast.classList.add("hidden"), 2800);
}

function buildQuery() {
  const params = new URLSearchParams();
  if (state.status) params.set("status", state.status);
  if (state.priority) params.set("priority", state.priority);
  if (state.search) params.set("search", state.search);
  params.set("page", state.page);
  params.set("limit", state.limit);
  return params.toString();
}

async function fetchTasks() {
  el.loading.classList.remove("hidden");
  el.empty.classList.add("hidden");
  el.taskList.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}?${buildQuery()}`);
    if (!res.ok) throw new Error("Failed to load tasks");
    const { data, pagination } = await res.json();

    el.loading.classList.add("hidden");

    if (data.length === 0) {
      el.empty.classList.remove("hidden");
      el.pagination.innerHTML = "";
      return;
    }

    data.forEach((task) => el.taskList.appendChild(renderTaskCard(task)));
    renderPagination(pagination);
  } catch (err) {
    el.loading.classList.add("hidden");
    showToast(err.message, true);
  }
}

function renderTaskCard(task) {
  const li = document.createElement("li");
  li.className = `task-card ${task.status === "Completed" ? "completed" : ""}`;

  const created = new Date(task.createdAt).toLocaleString();

  li.innerHTML = `
    <div class="task-main">
      <div class="task-title-row">
        <p class="task-title"></p>
        <span class="badge priority-${task.priority}">${task.priority}</span>
        <span class="badge status-${task.status}">${task.status}</span>
      </div>
      <p class="task-description"></p>
      <div class="task-meta">Created: ${created}</div>
    </div>
    <div class="task-actions">
      <button class="btn btn-small btn-secondary toggle-btn">
        Mark as ${task.status === "Completed" ? "Pending" : "Completed"}
      </button>
      <button class="btn btn-small btn-secondary edit-btn">Edit</button>
      <button class="btn btn-small btn-danger delete-btn">Delete</button>
    </div>
  `;

  // Safely set text content to avoid HTML injection from user input.
  li.querySelector(".task-title").textContent = task.title;
  li.querySelector(".task-description").textContent = task.description || "";

  li.querySelector(".toggle-btn").addEventListener("click", () => toggleStatus(task));
  li.querySelector(".edit-btn").addEventListener("click", () => openEditModal(task));
  li.querySelector(".delete-btn").addEventListener("click", () => deleteTask(task.id));

  return li;
}

function renderPagination(pagination) {
  el.pagination.innerHTML = "";
  const { page, totalPages } = pagination;
  if (totalPages <= 1) return;

  const prev = document.createElement("button");
  prev.textContent = "← Prev";
  prev.disabled = page <= 1;
  prev.addEventListener("click", () => {
    state.page -= 1;
    fetchTasks();
  });
  el.pagination.appendChild(prev);

  for (let p = 1; p <= totalPages; p++) {
    const btn = document.createElement("button");
    btn.textContent = p;
    if (p === page) btn.classList.add("active");
    btn.addEventListener("click", () => {
      state.page = p;
      fetchTasks();
    });
    el.pagination.appendChild(btn);
  }

  const next = document.createElement("button");
  next.textContent = "Next →";
  next.disabled = page >= totalPages;
  next.addEventListener("click", () => {
    state.page += 1;
    fetchTasks();
  });
  el.pagination.appendChild(next);
}

async function toggleStatus(task) {
  const newStatus = task.status === "Completed" ? "Pending" : "Completed";
  try {
    const res = await fetch(`${API_BASE}/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) throw new Error("Failed to update status");
    showToast(`Task marked as ${newStatus}`);
    fetchTasks();
  } catch (err) {
    showToast(err.message, true);
  }
}

async function deleteTask(id) {
  if (!confirm("Delete this task? This cannot be undone.")) return;
  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) throw new Error("Failed to delete task");
    showToast("Task deleted");
    fetchTasks();
  } catch (err) {
    showToast(err.message, true);
  }
}

function openCreateModal() {
  state.editingId = null;
  el.modalTitle.textContent = "New Task";
  el.form.reset();
  el.taskId.value = "";
  el.titleError.textContent = "";
  el.modal.classList.remove("hidden");
  el.titleInput.focus();
}

function openEditModal(task) {
  state.editingId = task.id;
  el.modalTitle.textContent = "Edit Task";
  el.taskId.value = task.id;
  el.titleInput.value = task.title;
  el.descriptionInput.value = task.description || "";
  el.priorityInput.value = task.priority;
  el.statusInput.value = task.status;
  el.titleError.textContent = "";
  el.modal.classList.remove("hidden");
  el.titleInput.focus();
}

function closeModal() {
  el.modal.classList.add("hidden");
}

async function handleFormSubmit(e) {
  e.preventDefault();
  el.titleError.textContent = "";

  const title = el.titleInput.value.trim();
  if (!title) {
    el.titleError.textContent = "Title is required.";
    return;
  }

  const payload = {
    title,
    description: el.descriptionInput.value.trim(),
    priority: el.priorityInput.value,
    status: el.statusInput.value,
  };

  const isEdit = Boolean(state.editingId);
  const url = isEdit ? `${API_BASE}/${state.editingId}` : API_BASE;
  const method = isEdit ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message = body.errors ? body.errors.join(" ") : body.error || "Request failed";
      throw new Error(message);
    }

    showToast(isEdit ? "Task updated" : "Task created");
    closeModal();
    fetchTasks();
  } catch (err) {
    el.titleError.textContent = err.message;
  }
}

// --- Event wiring ---
el.newTaskBtn.addEventListener("click", openCreateModal);
el.cancelBtn.addEventListener("click", closeModal);
el.modal.addEventListener("click", (e) => {
  if (e.target === el.modal) closeModal();
});
el.form.addEventListener("submit", handleFormSubmit);

el.statusFilter.addEventListener("change", () => {
  state.status = el.statusFilter.value;
  state.page = 1;
  fetchTasks();
});

el.priorityFilter.addEventListener("change", () => {
  state.priority = el.priorityFilter.value;
  state.page = 1;
  fetchTasks();
});

el.searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    state.search = el.searchInput.value;
    state.page = 1;
    fetchTasks();
  }, 300);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !el.modal.classList.contains("hidden")) closeModal();
});

fetchTasks();
