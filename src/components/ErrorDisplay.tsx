import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AppError, ErrorType } from '../services/errorService';

interface ErrorDisplayProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
}) => {
  const getErrorIcon = (type: ErrorType): string => {
    switch (type) {
      case ErrorType.NETWORK:
        return '📡';
      case ErrorType.AI_PROCESSING:
        return '🤖';
      case ErrorType.PAYMENT:
        return '💳';
      case ErrorType.AUTHENTICATION:
        return '🔐';
      case ErrorType.INSUFFICIENT_CREDITS:
        return '💰';
      case ErrorType.FILE_PROCESSING:
        return '📁';
      default:
        return '⚠️';
    }
  };

  const getErrorColor = (type: ErrorType): string => {
    switch (type) {
      case ErrorType.NETWORK:
        return '#ff6b6b';
      case ErrorType.AI_PROCESSING:
        return '#4ecdc4';
      case ErrorType.PAYMENT:
        return '#45b7d1';
      case ErrorType.AUTHENTICATION:
        return '#f9ca24';
      case ErrorType.INSUFFICIENT_CREDITS:
        return '#f0932b';
      case ErrorType.FILE_PROCESSING:
        return '#eb4d4b';
      default:
        return '#6c5ce7';
    }
  };

  const showErrorDetails = () => {
    Alert.alert(
      'Error Details',
      `Code: ${error.code}\nType: ${error.type}\nTime: ${error.timestamp.toLocaleString()}\n\nTechnical Details:\n${error.message}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { borderLeftColor: getErrorColor(error.type) }]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{getErrorIcon(error.type)}</Text>
        <View style={styles.headerText}>
          <Text style={styles.title}>Error</Text>
          <Text style={styles.code}>{error.code}</Text>
        </View>
      </View>

      <Text style={styles.message}>{error.userMessage}</Text>

      <View style={styles.actions}>
        {error.retryable && onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}

        {showDetails && (
          <TouchableOpacity style={styles.detailsButton} onPress={showErrorDetails}>
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>
        )}

        {onDismiss && (
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  code: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  message: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  detailsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  dismissButtonText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '600',
  },
});