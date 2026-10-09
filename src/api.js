// api.js - API client with tiered fallback (API -> local JSON -> mock.js)
import { generateMockNetwork, generateMockScenarios } from './mock.js';

// Empty string means use local files, then mock fallback
export const API_BASE = '';

let cachedNetwork = null;
let cachedScenarios = null;

export async function fetchNetwork() {
  if (cachedNetwork) return cachedNetwork;

  if (API_BASE) {
    try {
      const res = await fetch(API_BASE + '/network');
      if (res.ok) {
        cachedNetwork = await res.json();
        return cachedNetwork;
      }
    } catch {
      // Continue to local file fallback
    }
  }

  try {
    const res = await fetch('/network.json');
    if (res.ok) {
      cachedNetwork = await res.json();
      return cachedNetwork;
    }
  } catch {
    // Continue to mock fallback
  }

  cachedNetwork = generateMockNetwork();
  return cachedNetwork;
}

export async function fetchScenario(leakNode, sizeLabel) {
  const targetId = leakNode + '_' + sizeLabel;

  if (API_BASE) {
    try {
      const url = API_BASE + '/scenario?node=' + encodeURIComponent(leakNode) + '&size=' + encodeURIComponent(sizeLabel);
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Continue to local file fallback
    }
  }

  // Local file fallback
  if (!cachedScenarios) {
    try {
      const res = await fetch('/scenarios.json');
      if (res.ok) {
        const data = await res.json();
        cachedScenarios = Array.isArray(data) ? data : Object.values(data);
      }
    } catch {
      // Continue to mock fallback
    }
  }

  if (cachedScenarios && cachedScenarios.length > 0) {
    // Look for exact match
    let found = cachedScenarios.find(s => s.id === targetId || (s.leak_node === leakNode && s.size_label === sizeLabel));
    if (found) return found;

    // Look for same leak node with any size
    found = cachedScenarios.find(s => s.leak_node === leakNode);
    if (found) return found;

    // Default to first scenario in local data
    return cachedScenarios[0];
  }

  // In-memory mock fallback
  const net = await fetchNetwork();
  const mocks = generateMockScenarios(net);
  let match = mocks.find(s => s.id === targetId || (s.leak_node === leakNode && s.size_label === sizeLabel));
  if (!match) match = mocks[0];
  return match;
}
