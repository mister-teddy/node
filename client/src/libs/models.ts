export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  power: number; // 1-5 rating for model capability
  cost: number; // 1-5 rating for resource consumption (1=cheap, 5=expensive)
  speed: number; // 1-5 rating for response speed (1=slow, 5=fast)
  special_label?: string; // "flagship", "most powerful", etc.
}

export interface ModelInfoResponse {
  data: ModelInfo[];
  has_more: boolean;
  first_id?: string;
  last_id?: string;
}
