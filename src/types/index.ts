export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Label {
  id: number;
  name: string;
  color: string;
  user_id: number;
  is_shared: number;
  created_at: string;
}

export interface Item {
  id: number;
  url: string;
  title: string | null;
  image_url: string | null;
  price: string | null;
  price_raw: number | null;
  description: string | null;
  last_price_check: string | null;
  user_id: number | null;
  created_at: string;
  labels: Label[];
  label_ids: number[];
}

export interface Comment {
  id: number;
  item_id: number;
  user_id: number | null;
  user_name: string;
  text: string;
  created_at: string;
}

export interface LabelShare {
  id: number;
  label_id: number;
  shared_with_user_id: number;
  email: string;
  created_at: string;
}
