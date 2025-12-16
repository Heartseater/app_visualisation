import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ActivityIndicator } from 'react-native';

interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'danger' | 'outline';
  isLoading?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({ 
  title, 
  variant = 'primary', 
  isLoading = false,
  style, 
  disabled,
  ...props 
}) => {
  
  // Définition des couleurs selon la variante
  const getBackgroundColor = () => {
    if (variant === 'outline') return '#374151';
    if (variant === 'danger') return '#EF4444'; // Rouge moderne
    return '#007A5E'; // Vert ENSIMAG par défaut
  };

  const getTextColor = () => {
    if (variant === 'outline') return 'white';
    return 'white';
  };


  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: getBackgroundColor() },
        disabled && styles.disabled, // Style si désactivé
        style,
      ]}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // Ombre légère pour les boutons pleins
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  text: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.6,
  }
});