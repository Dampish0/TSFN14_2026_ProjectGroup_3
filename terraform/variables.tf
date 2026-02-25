variable "project_name" {
  description = "Namn på projektet"
  type        = string
  default     = "fogis"
}

variable "location" {
  description = "Azure region."
  type        = string
  default     = "westeurope"
}

variable "resource_group_name" {
  description = "Namn på Resource Group."
  type        = string
  default     = "rg-fogis"
}

variable "node_count" {
  description = "Antal noder i AKS."
  type        = number
  default     = 1
}

variable "node_vm_size" {
  description = "VM-storlek för AKS-noder."
  type        = string
  default     = "Standard_B2s"
}

variable "tags" {
  description = "Taggar som sätts på resurser."
  type        = map(string)
  default     = {
    project = "fogis"
  }
}
