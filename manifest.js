// iOS Privacy Manifest Generator — browser-only, no API.
// Generates PrivacyInfo.xcprivacy plist content based on Apple's required API categories.

// Source: https://developer.apple.com/documentation/bundleresources/privacy_manifest_files/describing_use_of_required_reason_api
const REQUIRED_REASON_APIS = [
  {
    id: "file_timestamp",
    label: "File Timestamp APIs",
    description: "Access file creation, modification, or status-change timestamps",
    category: "NSPrivacyAccessedAPICategoryFileTimestamp",
    examples: "NSFileCreationDate, NSFileModificationDate, NSURLCreationDateKey, getattrlist, stat",
    reasons: [
      { code: "C617.1", label: "Displaying to user: Provide the access date/time to the app user" },
      { code: "3B52.1", label: "File synchronization: Needed for syncing files (e.g. iCloud backup)" },
      { code: "0A2A.1", label: "Backup: Preserving file creation or modification time during backup" },
      { code: "DDA9.1", label: "App file access: Accessing timestamps of files created by this app" },
    ],
  },
  {
    id: "system_boot",
    label: "System Boot Time APIs",
    description: "Access the system boot time (uptime since last reboot)",
    category: "NSPrivacyAccessedAPICategorySystemBootTime",
    examples: "sysctl, systemUptime, NSProcessInfo.systemUptime",
    reasons: [
      { code: "35F9.1", label: "Measuring app performance (time between events, latency)" },
      { code: "8FFB.1", label: "Calculating how long an operation takes (no absolute date)" },
      { code: "3D61.1", label: "User verification: Preventing multiple uses of a one-time feature" },
    ],
  },
  {
    id: "disk_space",
    label: "Disk Space APIs",
    description: "Access available disk space or total disk capacity",
    category: "NSPrivacyAccessedAPICategoryDiskSpace",
    examples: "volumeAvailableCapacityKey, volumeTotalCapacityKey, statfs",
    reasons: [
      { code: "85F4.1", label: "Displaying disk space to the user" },
      { code: "E174.1", label: "Checking for space before writing a file to disk" },
      { code: "7D9E.1", label: "Health reporting: Alerting when disk is nearly full" },
    ],
  },
  {
    id: "active_keyboards",
    label: "Active Keyboard APIs",
    description: "Retrieve the list of active keyboard identifiers",
    category: "NSPrivacyAccessedAPICategoryActiveKeyboards",
    examples: "UITextInputMode.activeInputModes",
    reasons: [
      { code: "54BD.1", label: "Providing matching keyboard layout UI for the active keyboard" },
    ],
  },
  {
    id: "user_defaults",
    label: "User Defaults APIs",
    description: "Read values from shared app group user defaults or another app's user defaults",
    category: "NSPrivacyAccessedAPICategoryUserDefaults",
    examples: "UserDefaults.standard, UserDefaults(suiteName:), NSUserDefaults",
    reasons: [
      { code: "CA92.1", label: "Accessing your own app's user defaults" },
      { code: "1C8F.1", label: "Accessing group container defaults shared with your own app extensions" },
      { code: "C56D.1", label: "User-facing settings that the user expects to persist" },
      { code: "AC6B.1", label: "Third-party SDK: SDK listed in the privacy manifest accesses this" },
    ],
  },
];

// Tracking domains (common ad/analytics networks)
const COMMON_TRACKING_DOMAINS = [
  { domain: "api.segment.io",         label: "Segment analytics" },
  { domain: "api.amplitude.com",      label: "Amplitude" },
  { domain: "api.mixpanel.com",       label: "Mixpanel" },
  { domain: "firebaseapp.com",        label: "Firebase / Google Analytics" },
  { domain: "googletagmanager.com",   label: "Google Tag Manager" },
  { domain: "facebook.com",           label: "Meta / Facebook SDK" },
  { domain: "appsflyer.com",          label: "AppsFlyer attribution" },
  { domain: "adjust.com",             label: "Adjust attribution" },
  { domain: "branch.io",              label: "Branch deep linking" },
  { domain: "kochava.com",            label: "Kochava" },
  { domain: "tenjin.com",             label: "Tenjin" },
  { domain: "onesignal.com",          label: "OneSignal push (if tracking)" },
];

// Collected data types for the nutrition label section
const DATA_TYPES = [
  { id: "dt_name",       label: "Name",                 linked: true,  category: "Contact Info" },
  { id: "dt_email",      label: "Email Address",        linked: true,  category: "Contact Info" },
  { id: "dt_phone",      label: "Phone Number",         linked: true,  category: "Contact Info" },
  { id: "dt_precise",    label: "Precise Location",     linked: true,  category: "Location" },
  { id: "dt_coarse",     label: "Coarse Location",      linked: false, category: "Location" },
  { id: "dt_usage",      label: "Product Interaction",  linked: true,  category: "Usage Data" },
  { id: "dt_crash",      label: "Crash Data",           linked: false, category: "Diagnostics" },
  { id: "dt_perf",       label: "Performance Data",     linked: false, category: "Diagnostics" },
  { id: "dt_device_id",  label: "Device ID",            linked: true,  category: "Identifiers" },
  { id: "dt_purchase",   label: "Purchase History",     linked: true,  category: "Purchases" },
];

// Selected state
const selected = {
  apis: {},       // id -> [reason_codes]
  tracking: {},   // domain -> bool
  customDomains: [],
  dataTypes: {},  // id -> bool
  tracking_enabled: false,
};

function buildForm() {
  buildApiSection();
  buildTrackingSection();
  buildDataSection();
}

function buildApiSection() {
  const container = document.getElementById("apiAccordion");
  REQUIRED_REASON_APIS.forEach(api => {
    const div = document.createElement("div");
    div.className = "api-card";
    div.innerHTML = `
      <label class="api-label">
        <input type="checkbox" data-api="${api.id}" onchange="toggleApi('${api.id}', this)" />
        <div class="api-info">
          <div class="api-name">${api.label}</div>
          <div class="api-desc">${api.description}</div>
          <div class="api-eg">e.g. <code>${api.examples.split(",")[0].trim()}</code></div>
        </div>
      </label>
      <div class="reason-group" id="reasons_${api.id}" style="display:none">
        <div class="reason-title">Why does your app use this? (select all that apply)</div>
        ${api.reasons.map(r => `
          <label class="reason-item">
            <input type="checkbox" data-api="${api.id}" data-code="${r.code}"
              onchange="toggleReason('${api.id}', '${r.code}', this)" />
            <span><b>${r.code}</b> — ${r.label}</span>
          </label>
        `).join("")}
      </div>
    `;
    container.appendChild(div);
  });
}

function buildTrackingSection() {
  const container = document.getElementById("trackingDomains");
  COMMON_TRACKING_DOMAINS.forEach(t => {
    const label = document.createElement("label");
    label.className = "check-item";
    label.innerHTML = `<input type="checkbox" data-domain="${t.domain}" onchange="toggleDomain('${t.domain}', this)" />
      <span>${t.domain} <span class="sdk-label">${t.label}</span></span>`;
    container.appendChild(label);
  });
}

function buildDataSection() {
  const container = document.getElementById("dataTypes");
  const byCategory = {};
  DATA_TYPES.forEach(d => {
    if (!byCategory[d.category]) byCategory[d.category] = [];
    byCategory[d.category].push(d);
  });

  Object.entries(byCategory).forEach(([cat, types]) => {
    const header = document.createElement("div");
    header.className = "data-category";
    header.textContent = cat;
    container.appendChild(header);
    types.forEach(d => {
      const label = document.createElement("label");
      label.className = "check-item";
      label.innerHTML = `<input type="checkbox" data-dtype="${d.id}" onchange="toggleDataType('${d.id}', this)" />
        <span>${d.label}${d.linked ? ' <span class="linked-badge">linked to identity</span>' : ''}</span>`;
      container.appendChild(label);
    });
  });
}

function toggleApi(id, el) {
  if (el.checked) {
    selected.apis[id] = [];
    document.getElementById(`reasons_${id}`).style.display = "block";
  } else {
    delete selected.apis[id];
    document.getElementById(`reasons_${id}`).style.display = "none";
    // uncheck reasons
    document.querySelectorAll(`input[data-api="${id}"][data-code]`).forEach(c => c.checked = false);
  }
}

function toggleReason(apiId, code, el) {
  if (!selected.apis[apiId]) selected.apis[apiId] = [];
  if (el.checked) {
    if (!selected.apis[apiId].includes(code)) selected.apis[apiId].push(code);
  } else {
    selected.apis[apiId] = selected.apis[apiId].filter(c => c !== code);
  }
}

function toggleDomain(domain, el) {
  selected.tracking[domain] = el.checked;
}

function toggleDataType(id, el) {
  selected.dataTypes[id] = el.checked;
}

function addCustomDomain() {
  const input = document.getElementById("customDomain");
  const domain = input.value.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!domain || selected.customDomains.includes(domain)) return;
  selected.customDomains.push(domain);
  const tag = document.createElement("span");
  tag.className = "custom-domain-tag";
  tag.innerHTML = `${domain} <button onclick="removeCustomDomain('${domain}', this)">×</button>`;
  document.getElementById("customDomainTags").appendChild(tag);
  input.value = "";
}

function removeCustomDomain(domain, btn) {
  selected.customDomains = selected.customDomains.filter(d => d !== domain);
  btn.closest(".custom-domain-tag").remove();
}

function escXml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function generateManifest() {
  const apiEntries = Object.entries(selected.apis);
  const allDomains = [
    ...Object.entries(selected.tracking).filter(([,v])=>v).map(([k])=>k),
    ...selected.customDomains,
  ];
  const hasTracking = allDomains.length > 0 || document.getElementById("tracksUsers").checked;
  const tracksUsers = document.getElementById("tracksUsers").checked;

  const lines = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">`);
  lines.push(`<plist version="1.0">`);
  lines.push(`<dict>`);

  // NSPrivacyTracking
  lines.push(`    <key>NSPrivacyTracking</key>`);
  lines.push(`    <${tracksUsers}>`);

  // NSPrivacyTrackingDomains
  if (allDomains.length > 0) {
    lines.push(`    <key>NSPrivacyTrackingDomains</key>`);
    lines.push(`    <array>`);
    allDomains.forEach(d => lines.push(`        <string>${escXml(d)}</string>`));
    lines.push(`    </array>`);
  }

  // NSPrivacyAccessedAPITypes
  if (apiEntries.length > 0) {
    lines.push(`    <key>NSPrivacyAccessedAPITypes</key>`);
    lines.push(`    <array>`);
    apiEntries.forEach(([id, reasons]) => {
      const api = REQUIRED_REASON_APIS.find(a => a.id === id);
      if (!api) return;
      lines.push(`        <dict>`);
      lines.push(`            <key>NSPrivacyAccessedAPIType</key>`);
      lines.push(`            <string>${api.category}</string>`);
      lines.push(`            <key>NSPrivacyAccessedAPITypeReasons</key>`);
      lines.push(`            <array>`);
      const reasonsList = reasons.length > 0 ? reasons : [api.reasons[0].code]; // default to first if none selected
      reasonsList.forEach(r => lines.push(`                <string>${r}</string>`));
      lines.push(`            </array>`);
      lines.push(`        </dict>`);
    });
    lines.push(`    </array>`);
  }

  // NSPrivacyCollectedDataTypes (from data types section)
  const selectedData = DATA_TYPES.filter(d => selected.dataTypes[d.id]);
  if (selectedData.length > 0) {
    lines.push(`    <key>NSPrivacyCollectedDataTypes</key>`);
    lines.push(`    <array>`);
    selectedData.forEach(d => {
      lines.push(`        <dict>`);
      lines.push(`            <key>NSPrivacyCollectedDataType</key>`);
      lines.push(`            <string>${d.label.replace(/\s+/g,"")}</string>`);
      lines.push(`            <key>NSPrivacyCollectedDataTypeLinked</key>`);
      lines.push(`            <${d.linked}>`);
      lines.push(`            <key>NSPrivacyCollectedDataTypeTracking</key>`);
      lines.push(`            <${tracksUsers}>`);
      lines.push(`            <key>NSPrivacyCollectedDataTypePurposes</key>`);
      lines.push(`            <array>`);
      lines.push(`                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>`);
      lines.push(`            </array>`);
      lines.push(`        </dict>`);
    });
    lines.push(`    </array>`);
  }

  lines.push(`</dict>`);
  lines.push(`</plist>`);

  const output = lines.join("\n");
  document.getElementById("outputBox").textContent = output;
  document.getElementById("outputSection").style.display = "block";
  document.getElementById("outputSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

function copyManifest() {
  const text = document.getElementById("outputBox").textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("copyBtn");
    btn.textContent = "Copied!";
    setTimeout(() => { btn.textContent = "Copy to clipboard"; }, 1800);
  });
}

function downloadManifest() {
  const text = document.getElementById("outputBox").textContent;
  const a = document.createElement("a");
  a.href = "data:text/xml;charset=utf-8," + encodeURIComponent(text);
  a.download = "PrivacyInfo.xcprivacy";
  a.click();
}

document.addEventListener("DOMContentLoaded", buildForm);
