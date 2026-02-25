output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "acr_login_server" {
  value = azurerm_container_registry.acr.login_server
}

output "aks_name" {
  value = azurerm_kubernetes_cluster.aks.name
}

output "kube_config_raw" {
  description = "Kubeconfig för att ansluta kubectl. Hanteras som sensitive."
  value       = azurerm_kubernetes_cluster.aks.kube_config_raw
  sensitive   = true
}
