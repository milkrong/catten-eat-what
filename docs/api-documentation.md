# API Documentation

## Base URL

```
https://eatwhatapi.cattenbox.com/api
```

For local development:

```
http://localhost:3002/api
```

## Authentication

All authenticated endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Authentication Endpoints

#### Register a new user

```
POST /api/auth/register
```

Request body:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username"
}
```

Response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "username"
    },
    "token": "jwt_token"
  }
}
```

#### User Login

```
POST /api/auth/login
```

Request body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "username"
    },
    "token": "jwt_token"
  }
}
```

#### Get Current User

```
GET /api/auth/me
```

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "username"
    }
  }
}
```

#### Refresh Token

```
POST /api/auth/refresh
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token"
  }
}
```

#### Logout

```
POST /api/auth/logout
```

Response:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Recipes

### Recipe Endpoints

#### Get All Recipes

```
GET /api/recipes
```

Query Parameters:

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of recipes per page (default: 10)
- `cuisineType` (optional): Filter by cuisine type (e.g., "Chinese", "Italian")
- `dietType` (optional): Filter by diet type, comma-separated (e.g., "Vegetarian,Gluten-free")
- `name` (optional): Filter by recipe name (partial match)
- `minCalories` (optional): Filter by minimum calories
- `maxCalories` (optional): Filter by maximum calories
- `maxCookingTime` (optional): Filter by maximum cooking time in minutes
- `sortBy` (optional): Sort by field (options: "name", "createdAt", "views", "cookingTime", "calories", default: "createdAt")
- `sortOrder` (optional): Sort order (options: "asc", "desc", default: "desc")

Response:

```json
{
  "success": true,
  "data": {
    "recipes": [
      {
        "id": "recipe_id",
        "name": "Recipe Name",
        "ingredients": [
          {
            "name": "Ingredient",
            "amount": 100,
            "unit": "g"
          }
        ],
        "calories": 500,
        "cooking_time": 30,
        "nutrition_facts": {
          "protein": 20,
          "fat": 10,
          "carbs": 50,
          "fiber": 5
        },
        "steps": ["Step 1", "Step 2"],
        "cuisine_type": ["Chinese"],
        "diet_type": ["Balanced"]
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

#### Get Recipe by ID

```
GET /api/recipes/:id
```

Response:

```json
{
  "success": true,
  "data": {
    "recipe": {
      "id": "recipe_id",
      "name": "Recipe Name",
      "ingredients": [
        {
          "name": "Ingredient",
          "amount": 100,
          "unit": "g"
        }
      ],
      "calories": 500,
      "cooking_time": 30,
      "nutrition_facts": {
        "protein": 20,
        "fat": 10,
        "carbs": 50,
        "fiber": 5
      },
      "steps": ["Step 1", "Step 2"],
      "cuisine_type": ["Chinese"],
      "diet_type": ["Balanced"]
    }
  }
}
```

#### Create Recipe

```
POST /api/recipes
```

Request body:

```json
{
  "name": "Recipe Name",
  "ingredients": [
    {
      "name": "Ingredient",
      "amount": 100,
      "unit": "g"
    }
  ],
  "calories": 500,
  "cooking_time": 30,
  "nutrition_facts": {
    "protein": 20,
    "fat": 10,
    "carbs": 50,
    "fiber": 5
  },
  "steps": ["Step 1", "Step 2"],
  "cuisine_type": ["Chinese"],
  "diet_type": ["Balanced"]
}
```

Response:

```json
{
  "success": true,
  "message": "Recipe created successfully",
  "data": {
    "recipe": {
      "id": "recipe_id",
      "name": "Recipe Name",
      "ingredients": [
        {
          "name": "Ingredient",
          "amount": 100,
          "unit": "g"
        }
      ],
      "calories": 500,
      "cooking_time": 30,
      "nutrition_facts": {
        "protein": 20,
        "fat": 10,
        "carbs": 50,
        "fiber": 5
      },
      "steps": ["Step 1", "Step 2"],
      "cuisine_type": ["Chinese"],
      "diet_type": ["Balanced"]
    }
  }
}
```

#### Update Recipe

```
PUT /api/recipes/:id
```

Request body:

```json
{
  "name": "Updated Recipe Name",
  "description": "Updated description"
}
```

Response:

```json
{
  "success": true,
  "message": "Recipe updated successfully",
  "data": {
    "recipe": {
      "id": "recipe_id",
      "name": "Updated Recipe Name",
      "description": "Updated description",
      "ingredients": [
        {
          "name": "Ingredient",
          "amount": 100,
          "unit": "g"
        }
      ],
      "calories": 500,
      "cooking_time": 30,
      "nutrition_facts": {
        "protein": 20,
        "fat": 10,
        "carbs": 50,
        "fiber": 5
      },
      "steps": ["Step 1", "Step 2"],
      "cuisine_type": ["Chinese"],
      "diet_type": ["Balanced"]
    }
  }
}
```

#### Delete Recipe

```
DELETE /api/recipes/:id
```

Response:

```json
{
  "success": true,
  "message": "Recipe deleted successfully"
}
```

## User Favorites

### User Favorites Endpoints

#### Get User's Favorite Recipes

```
GET /api/users/favorites
```

Response:

```json
{
  "success": true,
  "data": {
    "favorites": [
      {
        "id": "recipe_id",
        "name": "Recipe Name",
        "ingredients": [
          {
            "name": "Ingredient",
            "amount": 100,
            "unit": "g"
          }
        ],
        "calories": 500,
        "cooking_time": 30,
        "nutrition_facts": {
          "protein": 20,
          "fat": 10,
          "carbs": 50,
          "fiber": 5
        },
        "steps": ["Step 1", "Step 2"],
        "cuisine_type": ["Chinese"],
        "diet_type": ["Balanced"]
      }
    ]
  }
}
```

#### Add Recipe to Favorites

```
POST /api/users/favorites/:recipeId
```

Response:

```json
{
  "success": true,
  "message": "Recipe added to favorites"
}
```

#### Remove Recipe from Favorites

```
DELETE /api/users/favorites/:recipeId
```

Response:

```json
{
  "success": true,
  "message": "Recipe removed from favorites"
}
```

## Meal Plans

### Meal Plan Endpoints

#### Get User's Meal Plans

```
GET /api/meal-plans
```

Query Parameters:

- `startDate`: Start date in ISO format (e.g., 2024-02-01T00:00:00Z)
- `endDate`: End date in ISO format (e.g., 2024-02-07T23:59:59Z)

Response:

```json
{
  "success": true,
  "data": {
    "mealPlans": [
      {
        "id": "meal_plan_id",
        "date": "2024-02-01T12:00:00Z",
        "meal_type": "lunch",
        "recipe": {
          "id": "recipe_id",
          "name": "Recipe Name",
          "calories": 500,
          "cooking_time": 30,
          "cuisine_type": ["Chinese"],
          "diet_type": ["Balanced"]
        }
      }
    ]
  }
}
```

#### Create Meal Plan

```
POST /api/meal-plans
```

Request body:

```json
{
  "date": "2024-02-01T12:00:00Z",
  "meal_type": "lunch",
  "recipe_id": "recipe_id"
}
```

Response:

```json
{
  "success": true,
  "message": "Meal plan created successfully",
  "data": {
    "mealPlan": {
      "id": "meal_plan_id",
      "date": "2024-02-01T12:00:00Z",
      "meal_type": "lunch",
      "recipe": {
        "id": "recipe_id",
        "name": "Recipe Name"
      }
    }
  }
}
```

#### Update Meal Plan

```
PUT /api/meal-plans/:id
```

Request body:

```json
{
  "meal_type": "dinner"
}
```

Response:

```json
{
  "success": true,
  "message": "Meal plan updated successfully",
  "data": {
    "mealPlan": {
      "id": "meal_plan_id",
      "date": "2024-02-01T12:00:00Z",
      "meal_type": "dinner",
      "recipe": {
        "id": "recipe_id",
        "name": "Recipe Name"
      }
    }
  }
}
```

#### Delete Meal Plan

```
DELETE /api/meal-plans/:id
```

Response:

```json
{
  "success": true,
  "message": "Meal plan deleted successfully"
}
```

#### Generate Meal Plan

```
POST /api/meal-plans/generate
```

Request body:

```json
{
  "startDate": "2024-02-01T00:00:00Z",
  "endDate": "2024-02-07T23:59:59Z",
  "preferences": {
    "cuisineTypes": ["Chinese", "Japanese"],
    "dietTypes": ["Balanced"],
    "maxCookingTime": 45,
    "caloriesPerDay": 2000
  }
}
```

Response:

```json
{
  "success": true,
  "message": "Meal plan generated successfully",
  "data": {
    "mealPlans": [
      {
        "id": "meal_plan_id",
        "date": "2024-02-01T12:00:00Z",
        "meal_type": "lunch",
        "recipe": {
          "id": "recipe_id",
          "name": "Recipe Name"
        }
      }
    ]
  }
}
```

## Recommendations

### Recommendation Endpoints

#### Get Single Meal Recommendation

```
POST /api/recommendations/single
```

Request body:

```json
{
  "preferences": {
    "diet_type": ["Balanced"],
    "cuisine_type": ["Chinese"],
    "allergies": ["Broccoli"],
    "restrictions": ["Low Protein"],
    "calories_min": 1800,
    "calories_max": 2200,
    "max_cooking_time": 45,
    "meals_per_day": 3
  },
  "provider": "siliconflow"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "recommendation": {
      "id": "recommendation_id",
      "recipe": {
        "id": "recipe_id",
        "name": "Recipe Name",
        "ingredients": [
          {
            "name": "Ingredient",
            "amount": 100,
            "unit": "g"
          }
        ],
        "calories": 500,
        "cooking_time": 30,
        "nutrition_facts": {
          "protein": 20,
          "fat": 10,
          "carbs": 50,
          "fiber": 5
        },
        "steps": ["Step 1", "Step 2"],
        "cuisine_type": ["Chinese"],
        "diet_type": ["Balanced"]
      }
    }
  }
}
```

#### Get Daily Recommendations

```
POST /api/recommendations/daily
```

Request body:

```json
{
  "preferences": {
    "diet_type": ["Balanced"],
    "cuisine_type": ["Sichuan", "Cantonese"],
    "allergies": [],
    "restrictions": [],
    "calories_min": 1800,
    "calories_max": 2200,
    "max_cooking_time": 45,
    "meals_per_day": 3
  },
  "provider": "siliconflow"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "meal_type": "breakfast",
        "recipe": {
          "id": "recipe_id",
          "name": "Breakfast Recipe",
          "calories": 400,
          "cooking_time": 15,
          "cuisine_type": ["Chinese"],
          "diet_type": ["Balanced"]
        }
      },
      {
        "meal_type": "lunch",
        "recipe": {
          "id": "recipe_id",
          "name": "Lunch Recipe",
          "calories": 700,
          "cooking_time": 30,
          "cuisine_type": ["Sichuan"],
          "diet_type": ["Balanced"]
        }
      },
      {
        "meal_type": "dinner",
        "recipe": {
          "id": "recipe_id",
          "name": "Dinner Recipe",
          "calories": 800,
          "cooking_time": 45,
          "cuisine_type": ["Cantonese"],
          "diet_type": ["Balanced"]
        }
      }
    ]
  }
}
```

## Admin

### Admin Endpoints

#### Get All Users (Admin only)

```
GET /api/admin/users
```

Response:

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_id",
        "email": "user@example.com",
        "username": "username",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### Get User by ID (Admin only)

```
GET /api/admin/users/:id
```

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "username",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

## Error Responses

All API endpoints return a consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message description"
  }
}
```

Common error codes:

- `UNAUTHORIZED`: Authentication required or invalid token
- `FORBIDDEN`: User does not have permission to access the resource
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request parameters
- `INTERNAL_SERVER_ERROR`: Server error

## Rate Limiting

API requests are subject to rate limiting. The current limits are:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

When rate limited, the API will return a 429 Too Many Requests status code with headers indicating the rate limit and when it will reset.
