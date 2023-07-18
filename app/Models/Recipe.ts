import { User } from './User.old'

export type Recipe = {
  id?: string
  title?: string
  description?: string | null
  servings?: number | null
  totalTimeInMinutes?: number | null
  ingredients?: Ingredient[]
  directions?: Direction[]
  createdAt?: string
  updatedAt?: string
  user?: User
  userId?: string
}

type Ingredient = {
  quantity: number
  unitOfMeasurement: string
  product: string
}

type Direction = {
  description: string
}