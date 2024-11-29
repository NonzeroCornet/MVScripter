const NODETYPES = {
  "Test Node 1": {
    width: 120,
    height: 100,
    inputs: ["Input1", "Input2"],
    outputs: ["Output1", "Output2"],
    compile: "Inputs: %Input1 %Input2 and Outputs: %Output1 %Output2",
  },
  "Test Node 2": {
    width: 120,
    height: 100,
    inputs: ["Input1", "Input2"],
    outputs: ["Output1"],
    compile: "2 Inputs: %Input1 %Input2 and Outputs: %Output1",
  },
  "No Inputs": {
    width: 120,
    height: 100,
    inputs: [],
    outputs: ["Output1", "Output2"],
    compile: "Inputs: %Input1 %Input2",
  },
  "No Outputs": {
    width: 120,
    height: 100,
    inputs: ["Input1", "Input2"],
    outputs: [],
    compile: "Inputs: %Input1 %Input2",
  },
  Nothing: {
    width: 120,
    height: 100,
    inputs: [],
    outputs: [],
    compile: "Nothing",
  },
};
