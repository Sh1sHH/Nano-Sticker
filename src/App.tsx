import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorService } from '@/services/errorService';
import HomeScreen from '@/screens/HomeScreen';
import PhotoSelectionScreen from '@/screens/PhotoSelectionScreen';
import SegmentationScreen from '@/screens/SegmentationScreen';
import StyleSelectionScreen from '@/screens/StyleSelectionScreen';
import ProcessingScreen from '@/screens/ProcessingScreen';
import EditingScreen from '@/screens/EditingScreen';
import { ExportScreen } from '@/screens/ExportScreen';
import { CreditPurchaseScreen } from '@/screens/CreditPurchaseScreen';

export type RootStackParamList = {
    Home: undefined;
    PhotoSelection: undefined;
    Segmentation: { imageUri: string };
    StyleSelection: { segmentedImageUri: string };
    Processing: { imageUri: string; style: string };
    Editing: { processedImageUri: string };
    Export: { finalImageUri: string };
    CreditPurchase: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
    const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
        const appError = ErrorService.categorizeError(error);
        ErrorService.logError(appError, 'Global Error Boundary');
        
        // Here you could send error to crash reporting service
        // crashlytics().recordError(error);
    };

    return (
        <ErrorBoundary onError={handleGlobalError}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <SafeAreaProvider>
                    <NavigationContainer>
                        <Stack.Navigator
                            initialRouteName="Home"
                            screenOptions={{
                                headerStyle: {
                                    backgroundColor: '#6366f1',
                                },
                                headerTintColor: '#fff',
                                headerTitleStyle: {
                                    fontWeight: 'bold',
                                },
                            }}>
                            <Stack.Screen
                                name="Home"
                                component={HomeScreen}
                                options={{ title: 'AI Sticker Generator' }}
                            />
                            <Stack.Screen
                                name="PhotoSelection"
                                component={PhotoSelectionScreen}
                                options={{ title: 'Select Photo' }}
                            />
                            <Stack.Screen
                                name="Segmentation"
                                component={SegmentationScreen}
                                options={{ title: 'Object Detection' }}
                            />
                            <Stack.Screen
                                name="StyleSelection"
                                component={StyleSelectionScreen}
                                options={{ title: 'Choose Style' }}
                            />
                            <Stack.Screen
                                name="Processing"
                                component={ProcessingScreen}
                                options={{ title: 'Creating Sticker' }}
                            />
                            <Stack.Screen
                                name="Editing"
                                component={EditingScreen}
                                options={{ title: 'Add Effects' }}
                            />
                            <Stack.Screen
                                name="Export"
                                component={ExportScreen}
                                options={{ title: 'Export Sticker' }}
                            />
                            <Stack.Screen
                                name="CreditPurchase"
                                component={CreditPurchaseScreen}
                                options={{ title: 'Get Credits' }}
                            />
                        </Stack.Navigator>
                    </NavigationContainer>
                </SafeAreaProvider>
            </GestureHandlerRootView>
        </ErrorBoundary>
    );
};

export default App;