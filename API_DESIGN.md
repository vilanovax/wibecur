# طراحی API

## 📡 ساختار کلی API

### Base URL
```
/api/v1
```

### Authentication
- استفاده از NextAuth.js Session
- Header: `Authorization: Bearer <token>`
- یا Cookie-based authentication

### Response Format
```typescript
// Success Response
{
  success: true,
  data: T,
  message?: string
}

// Error Response
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## 📋 Endpoints

### 🔐 Authentication

#### POST `/api/auth/signin`
ورود کاربر

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name"
    },
    "token": "jwt-token"
  }
}
```

---

#### POST `/api/auth/signup`
ثبت‌نام کاربر جدید

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

---

### 📝 Lists

#### GET `/api/lists`
دریافت لیست لیست‌ها

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `category`: string (optional)
- `sort`: 'trending' | 'newest' | 'popular' (default: 'trending')
- `search`: string (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "lists": [
      {
        "id": "list-id",
        "title": "بهترین فیلم‌های عاشقانه ۲۰۲۵",
        "description": "لیست کامل فیلم‌های عاشقانه...",
        "coverImage": "https://...",
        "category": {
          "id": "category-id",
          "name": "فیلم و سریال",
          "slug": "movies"
        },
        "tags": ["عاشقانه", "۲۰۲۵"],
        "isCurated": true,
        "isPublic": true,
        "createdBy": {
          "id": "user-id",
          "name": "Admin"
        },
        "stats": {
          "views": 1250,
          "bookmarks": 89,
          "likes": 234,
          "itemCount": 10
        },
        "createdAt": "2025-01-15T10:00:00Z",
        "updatedAt": "2025-01-20T15:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

#### GET `/api/lists/[id]`
دریافت جزئیات یک لیست

**Response:**
```json
{
  "success": true,
  "data": {
    "list": {
      "id": "list-id",
      "title": "بهترین فیلم‌های عاشقانه ۲۰۲۵",
      "description": "لیست کامل...",
      "coverImage": "https://...",
      "category": {...},
      "tags": [...],
      "items": [
        {
          "id": "item-id",
          "title": "فیلم ۱",
          "description": "...",
          "image": "https://...",
          "rank": 1,
          "score": 95.5,
          "stats": {
            "views": 500,
            "bookmarks": 45,
            "likes": 120
          }
        }
      ],
      "stats": {...},
      "createdAt": "...",
      "updatedAt": "..."
    },
    "userInteraction": {
      "isBookmarked": true,
      "isLiked": false
    }
  }
}
```

---

#### POST `/api/lists`
ساخت لیست جدید

**Authentication:** Required

**Request Body:**
```json
{
  "title": "لیست من",
  "description": "توضیحات لیست",
  "categoryId": "category-id",
  "tags": ["tag1", "tag2"],
  "coverImage": "https://...",
  "isPublic": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "list": {
      "id": "new-list-id",
      ...
    }
  }
}
```

---

#### PUT `/api/lists/[id]`
ویرایش لیست

**Authentication:** Required (Owner or Admin)

**Request Body:**
```json
{
  "title": "عنوان جدید",
  "description": "توضیحات جدید",
  ...
}
```

---

#### DELETE `/api/lists/[id]`
حذف لیست

**Authentication:** Required (Owner or Admin)

---

#### POST `/api/lists/[id]/bookmark`
بوکمارک/آنبوکمارک کردن لیست

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "isBookmarked": true
  }
}
```

---

### 🎯 Items

#### GET `/api/items`
دریافت لیست آیتم‌ها

**Query Parameters:**
- `page`: number
- `limit`: number
- `listId`: string (optional)
- `category`: string (optional)
- `search`: string (optional)
- `sort`: 'score' | 'newest' | 'popular'

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "item-id",
        "title": "فیلم ۱",
        "description": "توضیحات فیلم...",
        "image": "https://...",
        "externalLink": "https://...",
        "metadata": {
          "year": 2025,
          "genre": "عاشقانه",
          "city": null,
          "mood": "رمانتیک"
        },
        "stats": {
          "views": 500,
          "bookmarks": 45,
          "likes": 120,
          "dislikes": 5
        },
        "score": 95.5,
        "rank": 1,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": {...}
  }
}
```

---

#### GET `/api/items/[id]`
دریافت جزئیات یک آیتم

**Response:**
```json
{
  "success": true,
  "data": {
    "item": {
      "id": "item-id",
      "title": "فیلم ۱",
      "description": "توضیحات کامل...",
      "image": "https://...",
      "externalLink": "https://...",
      "metadata": {...},
      "lists": [
        {
          "id": "list-id",
          "title": "لیست ۱"
        }
      ],
      "similarItems": [...],
      "stats": {...},
      "score": 95.5,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "userInteraction": {
      "isBookmarked": true,
      "isLiked": true,
      "isDisliked": false
    }
  }
}
```

---

#### POST `/api/items`
ساخت آیتم جدید

**Authentication:** Required

**Request Body:**
```json
{
  "title": "آیتم جدید",
  "description": "توضیحات",
  "image": "https://...",
  "externalLink": "https://...",
  "metadata": {
    "year": 2025,
    "genre": "عاشقانه",
    "mood": "رمانتیک"
  },
  "listIds": ["list-id-1", "list-id-2"]
}
```

---

#### POST `/api/items/[id]/like`
لایک کردن آیتم

**Authentication:** Required

**Request Body:**
```json
{
  "action": "like" | "dislike" | "remove"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isLiked": true,
    "isDisliked": false,
    "stats": {
      "likes": 121,
      "dislikes": 5
    }
  }
}
```

---

#### POST `/api/items/[id]/bookmark`
بوکمارک کردن آیتم

**Authentication:** Required

---

### 🔍 Search

#### GET `/api/search`
جستجوی جامع

**Query Parameters:**
- `q`: string (required)
- `type`: 'all' | 'lists' | 'items' (default: 'all')
- `category`: string (optional)
- `city`: string (optional)
- `year`: number (optional)
- `genre`: string (optional)
- `mood`: string (optional)
- `page`: number
- `limit`: number

**Response:**
```json
{
  "success": true,
  "data": {
    "lists": [...],
    "items": [...],
    "pagination": {...}
  }
}
```

---

### 🤖 Recommendations

#### GET `/api/recommendations`
دریافت پیشنهادات شخصی

**Authentication:** Required

**Query Parameters:**
- `type`: 'lists' | 'items' | 'all' (default: 'all')
- `limit`: number (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "type": "list",
        "item": {
          "id": "list-id",
          "title": "...",
          ...
        },
        "score": 0.95,
        "reason": "بر اساس لیست‌های مشابهی که بوکمارک کرده‌اید"
      }
    ]
  }
}
```

---

### 👤 User

#### GET `/api/user/profile`
دریافت پروفایل کاربر

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "avatar": "https://...",
      "role": "user",
      "stats": {
        "listsCreated": 5,
        "bookmarks": 23,
        "likes": 45
      },
      "preferences": {
        "categories": ["movies", "books"],
        "notifications": {
          "newContent": true,
          "trending": true,
          "recommendations": true
        }
      },
      "createdAt": "..."
    }
  }
}
```

---

#### GET `/api/user/my-lists`
لیست‌های ساخته شده توسط کاربر

**Authentication:** Required

**Query Parameters:**
- `page`: number
- `limit`: number

---

#### GET `/api/user/bookmarks`
بوکمارک‌های کاربر

**Authentication:** Required

**Query Parameters:**
- `type`: 'lists' | 'items' | 'all' (default: 'all')
- `page`: number
- `limit`: number

---

#### GET `/api/user/activity`
فعالیت‌های کاربر

**Authentication:** Required

**Query Parameters:**
- `page`: number
- `limit`: number
- `type`: 'all' | 'bookmark' | 'like' | 'create' (optional)

---

### 📊 Analytics (Admin Only)

#### GET `/api/analytics/dashboard`
داده‌های داشبورد

**Authentication:** Required (Admin)

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 1500,
      "activeUsers": 450,
      "totalLists": 320,
      "totalItems": 2500,
      "totalBookmarks": 8500,
      "totalLikes": 12000
    },
    "growth": {
      "users": {
        "thisMonth": 150,
        "lastMonth": 120,
        "change": 25
      },
      ...
    },
    "trending": {
      "lists": [...],
      "items": [...]
    },
    "recentActivity": [...]
  }
}
```

---

### 📤 Upload

#### POST `/api/upload/image`
آپلود تصویر

**Authentication:** Required

**Request:** Multipart Form Data
- `file`: File
- `type`: 'list-cover' | 'item-image' | 'avatar'

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.example.com/image.jpg",
    "thumbnail": "https://cdn.example.com/image-thumb.jpg"
  }
}
```

---

## 🔄 Webhooks (اختیاری)

### Events
- `list.created`
- `list.updated`
- `item.created`
- `item.updated`
- `user.registered`
- `trending.detected`

---

## 📝 Rate Limiting

- **Public Endpoints**: 100 requests/minute
- **Authenticated Endpoints**: 200 requests/minute
- **Admin Endpoints**: 500 requests/minute
- **Upload Endpoints**: 10 requests/minute

---

## 🔒 Security

### Headers
- `X-Request-ID`: برای tracking
- `X-RateLimit-Limit`: محدودیت rate
- `X-RateLimit-Remaining`: تعداد باقیمانده

### Validation
- تمام ورودی‌ها باید validate شوند
- استفاده از Zod برای schema validation
- Sanitize کردن خروجی‌ها

### CORS
- فقط دامنه‌های مجاز
- Credentials: true

---

## 📊 Caching Strategy

### Cache Keys
- `lists:trending` - TTL: 5 minutes
- `lists:[id]` - TTL: 10 minutes
- `items:[id]` - TTL: 10 minutes
- `recommendations:[userId]` - TTL: 30 minutes
- `search:[query]` - TTL: 5 minutes

### Cache Invalidation
- پس از ایجاد/ویرایش/حذف لیست
- پس از ایجاد/ویرایش/حذف آیتم
- پس از تعامل کاربر (لایک، بوکمارک)

---

## 🧪 Testing

### Test Cases
- Unit Tests برای هر endpoint
- Integration Tests برای flow های کامل
- Load Tests برای performance

### Example Test
```typescript
describe('GET /api/lists', () => {
  it('should return lists with pagination', async () => {
    const response = await request(app)
      .get('/api/lists')
      .query({ page: 1, limit: 20 });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.lists).toBeInstanceOf(Array);
    expect(response.body.data.pagination).toBeDefined();
  });
});
```

---

این طراحی API یک پایه محکم برای پیاده‌سازی backend فراهم می‌کند.

