const express = require('express');
const k8s = require('@kubernetes/client-node');
const yaml = require('js-yaml');

const app = express();
app.use(express.json());

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

app.post('/kubernetes', async (req, res) => {
  const { namespace, resourceType, operation, yaml: yamlString } = req.body;

  try {
    const client = kc.makeApiClient(k8s.CoreV1Api);
    let result;

    switch (operation) {
      case 'get':
        result = await getResource(client, namespace, resourceType);
        break;
      case 'create':
        result = await createResource(client, namespace, resourceType, yamlString);
        break;
      case 'delete':
        result = await deleteResource(client, namespace, resourceType, yamlString);
        break;
      default:
        throw new Error('Invalid operation');
    }

    res.json(result);
  } catch (error) {
    if (error.response) {
      console.error(`Error occurred: ${error.message}, Status Code: ${error.response.statusCode}, Response Body: ${JSON.stringify(error.response.body)}`);
      res.status(500).json({ error: error.message, statusCode: error.response.statusCode, body: error.response.body });
    } else {
      console.error(`Error occurred: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
});

async function getResource(client, namespace, resourceType) {
  switch (resourceType) {
    case 'pods':
      return await client.listNamespacedPod(namespace);
    case 'services':
      return await client.listNamespacedService(namespace);
    case 'deployments':
      const appsV1Api = kc.makeApiClient(k8s.AppsV1Api);
      return await appsV1Api.listNamespacedDeployment(namespace);
    default:
      throw new Error('Invalid resource type');
  }
}

async function createResource(client, namespace, resourceType, yamlString) {
  const spec = yaml.load(yamlString);
  switch (resourceType) {
    case 'pods':
      return await client.createNamespacedPod(namespace, spec);
    case 'services':
      return await client.createNamespacedService(namespace, spec);
    case 'deployments':
      const appsV1Api = kc.makeApiClient(k8s.AppsV1Api);
      return await appsV1Api.createNamespacedDeployment(namespace, spec);
    default:
      throw new Error('Invalid resource type');
  }
}


async function deleteResource(client, namespace, resourceType, yamlString) {
  const spec = yaml.load(yamlString);
  switch (resourceType) {
    case 'pods':
      return await client.deleteNamespacedPod(spec.metadata.name, namespace);
    case 'services':
      return await client.deleteNamespacedService(spec.metadata.name, namespace);
    case 'deployments':
      const appsV1Api = kc.makeApiClient(k8s.AppsV1Api);
      return await appsV1Api.deleteNamespacedDeployment(spec.metadata.name, namespace);
    default:
      throw new Error('Invalid resource type');
  }
}

const port = process.env.PORT || 6749;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
