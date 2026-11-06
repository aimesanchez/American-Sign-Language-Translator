
let cachedModel = null;

// Load the converted Random Forest model once.
export async function loadASLModel() {
  if (cachedModel) return cachedModel;

  const response = await fetch("/models/asl_model_browser.json");

  if (!response.ok) {
    throw new Error("Unable to load ASL model");
  }

  const model = await response.json();

  if (
    model.features !== 63 ||
    !Array.isArray(model.classes) ||
    !Array.isArray(model.trees)
  ) {
    throw new Error("Invalid ASL model format");
  }

  cachedModel = model;
  return model;
}

// Convert MediaPipe's 21 landmarks into 63 numbers.
export function extractFeatures(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length !== 21) {
    throw new Error("Expected 21 hand landmarks");
  }

  return landmarks.flatMap((point) => [
    point.x,
    point.y,
    point.z,
  ]);
}

// Run one decision tree.
function predictTree(tree, features) {
  let node = 0;

  while (tree.left[node] !== -1) {
    const featureIndex = tree.feature[node];
    const threshold = tree.threshold[node];

    if (features[featureIndex] <= threshold) {
      node = tree.left[node];
    } else {
      node = tree.right[node];
    }
  }

  return tree.value[node];
}

// Average predictions across all 200 trees.
export function predictASL(model, landmarks) {
  const features = extractFeatures(landmarks);
  const probabilities = new Array(model.classes.length).fill(0);

  for (const tree of model.trees) {
    const treeProbabilities = predictTree(tree, features);

    for (let i = 0; i < probabilities.length; i++) {
      probabilities[i] += treeProbabilities[i];
    }
  }

  for (let i = 0; i < probabilities.length; i++) {
    probabilities[i] /= model.trees.length;
  }

  const bestIndex = probabilities.indexOf(
    Math.max(...probabilities)
  );

  return {
    letter: model.classes[bestIndex],
    confidence: probabilities[bestIndex],
  };
}
