# Service Mesh Network Runbook (Linkerd)

## Why Linkerd
Rust-based data-plane proxy, selected over Istio (Envoy) and Consul (Envoy) for lower
latency and memory footprint under sustained load (2,000 RPS benchmark):

| Metric | Linkerd | Istio | Consul |
|---|---|---|---|
| P50 added latency | 6 ms | 15–17 ms | degrades at high RPS |
| P99 added latency | 16.5 ms | 18.5 ms (sidecar) / 6.8 ms (ambient) | 55.5 ms @ 1,200 RPS |
| Memory / pod | 15–26 MB | 50–150+ MB | ~30 MB |
| Control plane memory | 365 MB | 597 MB–1+ GB | balanced |

## mTLS Enforcement
mTLS v1.3 is automatic and mandatory for all in-mesh traffic — no service may opt out.

## Authorization Policy Pattern (NER-Service example)
```yaml
apiVersion: policy.linkerd.io/v1beta3
kind: Server
metadata:
  name: ner-service-server
  namespace: core
spec:
  podSelector:
    matchLabels:
      app: ner-service
  port: 8080
  proxyProtocol: HTTP/2
---
apiVersion: policy.linkerd.io/v1alpha1
kind: MeshTLSAuthentication
metadata:
  name: api-gateway-client-identity
  namespace: core
spec:
  identities:
    - "api-gateway.core.serviceaccount.identity.linkerd.cluster.local"
---
apiVersion: policy.linkerd.io/v1alpha1
kind: AuthorizationPolicy
metadata:
  name: restrict-ner-access-to-gateway
  namespace: core
spec:
  targetRef:
    group: policy.linkerd.io
    kind: Server
    name: ner-service-server
  requiredAuthenticationRefs:
    - name: api-gateway-client-identity
      kind: MeshTLSAuthentication
      group: policy.linkerd.io
```

## Rule
Every new internal-only service (e.g., NER-Inference, Feature-Store-Reader) gets an
equivalent `Server` + `MeshTLSAuthentication` + `AuthorizationPolicy` triplet restricting
access to the specific caller identity — never left open to the whole mesh.
