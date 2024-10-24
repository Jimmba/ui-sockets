import { MESSAGE_TYPES } from "../constants";

export interface IData<T> {
  type: MESSAGE_TYPES;
  data: T;
  id: 0;
}
