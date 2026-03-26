package models

import "time"

// Language represents a supported language for the CMS.
type Language struct {
	ID         int       `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	Code       string    `gorm:"column:code;type:varchar(10);uniqueIndex;not null" json:"code"`
	Slug       string    `gorm:"column:slug;type:varchar(20);uniqueIndex;not null" json:"slug"`
	Name       string    `gorm:"column:name;type:varchar(100);not null" json:"name"`
	NativeName string    `gorm:"column:native_name;type:varchar(100);not null;default:''" json:"native_name"`
	Flag       string    `gorm:"column:flag;type:varchar(10);not null;default:''" json:"flag"`
	IsDefault  bool      `gorm:"column:is_default;not null;default:false" json:"is_default"`
	IsActive   bool      `gorm:"column:is_active;not null;default:true" json:"is_active"`
	HidePrefix bool      `gorm:"column:hide_prefix;not null;default:false" json:"hide_prefix"`
	SortOrder  int       `gorm:"column:sort_order;not null;default:0" json:"sort_order"`
	CreatedAt  time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

// TableName returns the database table name for the Language model.
func (Language) TableName() string {
	return "languages"
}
