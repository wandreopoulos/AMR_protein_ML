let sequenceModule;

function loadSequence() {
  if (!sequenceModule) {
    sequenceModule = Promise.resolve().then(() => {
      const jquery = require("jquery");
      window.jQuery = jquery;
      window.$ = jquery;
      window.Sequence = window.Sequence || {};
      return require("biojs-vis-sequence");
    }).catch((error) => { sequenceModule = undefined; throw error; });
  }
  return sequenceModule;
}

export const VALID_AMINO_ACIDS = /^[ACDEFGHIKLMNPQRSTVWY]+$/;

export function createBiojsSequence(element, options) {
  return loadSequence().then((Sequence) => {
    const jquery = window.jQuery;
    const prototype = Sequence.prototype;
    const viewer = Object.create(prototype);
    viewer.opt = jquery.extend(true, {}, prototype.opt, options, {
      target: element.id, format: "CODATA",
      formatOptions: { header: false, title: false, footer: false }
    });
    viewer._container = jquery(element);
    viewer._highlightsCount = 0;
    viewer._initialize();
    return viewer;
  });
}

export function disposeBiojsSequence(viewer, element) {
  if (!element) return;
  if (window.jQuery) window.jQuery(element).off().empty();
  const target = viewer?.opt?.target;
  if (target) document.getElementById(`sequenceTip${target}`)?.remove();
}
