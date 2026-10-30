# TODO

## Original script — UI requirements

```typescript
TODOs for the UI (Annie Giovanni Shri Thao):
The UI needs to be improved to look more professional in terms of allowing explainability and choosing the features to use and visualizing the classifications, visualizing which feature contributes the most, also the structural jmol/pymol visualizations.
Investigate if we can integrate some AI into the website, like Muse or Claude. We want freedom to ask questions about the features. Also we used soft-prompting, since ESM2 the weights are frozen but soft prompt is trainiable. Instead of fine-tuning (too computationally heavy for an edu class to do), if  a student could change the prompting and that way investigate if the result improves and how the features' contribution changes.

- install Krushna's web UI (node.js)
- see if we can integrate some AI command-line interface on the website, so someone would have a login and the session would be saved. And she could play with the model and try to improve the output for classifying AMR genes.
```

## TODOs for the UI — Annie, Giovanni, Shri, Thao

### Priority 1 — Get the existing interface running

1. Install Krushna’s web UI and its Node.js dependencies.
2. Verify the upload, backend connection, prediction flow, and existing visualizations locally.

### Priority 2 — Make the core classification experience clear

3. Improve the UI so it looks more professional and has a clear information hierarchy.
4. Visualize classifications clearly, including prediction labels, confidence, and sequence context.
5. Improve explainability so users can understand why a sequence received its classification.
6. Visualize which feature contributes the most to each classification.
7. Allow users to choose which features are used or displayed.

### Priority 3 — Add structural analysis

8. Integrate structural visualizations using Jmol/PyMOL.
9. Make structural results understandable alongside the classification and feature explanations.

### Priority 4 — Add AI-assisted exploration

10. Investigate whether AI can be integrated into the website, such as Muse or Claude.
11. Provide users with freedom to ask questions about the features and classifications.
12. Investigate integrating an AI command-line interface into the website.

### Priority 5 — Support experimentation and saved work

13. Support user login and saved sessions so users can experiment with the model over time.
14. Let users play with the model and try to improve AMR-gene classification output.
15. Investigate soft-prompting with ESM-2:
    - ESM-2 weights remain frozen.
    - The soft prompt is trainable.
    - This should be less computationally heavy than fine-tuning for an educational class project.
    - Let students change the prompt and investigate whether classification results improve.
    - Compare how feature contributions change when the prompt changes.
