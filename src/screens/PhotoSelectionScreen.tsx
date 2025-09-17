import React, {useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/App';
import { useAppStore } from '@/stores/appStore';
import PhotoSelectionComponent from '@/components/PhotoSelectionComponent';
import {CreditDisplay, InsufficientCreditsModal} from '@/components';
import {COLORS, CREDIT_COSTS} from '@/utils/constants';

type PhotoSelectionScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'PhotoSelection'
>;

interface Props {
    navigation: PhotoSelectionScreenNavigationProp;
}

const PhotoSelectionScreen: React.FC<Props> = ({ navigation }) => {
    const { setSelectedImageUri, credits } = useAppStore();
    const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false);

    const handleImageSelected = (imageUri: string) => {
        // Check if user has enough credits
        if (credits < CREDIT_COSTS.STICKER_GENERATION) {
            setShowInsufficientCreditsModal(true);
            return;
        }

        setSelectedImageUri(imageUri);
        navigation.navigate('Segmentation', { imageUri });
    };

    const handlePurchaseCredits = () => {
        setShowInsufficientCreditsModal(false);
        navigation.navigate('CreditPurchase');
    };

    const handleError = (error: string) => {
        Alert.alert('Error', error, [{ text: 'OK' }]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <CreditDisplay
                    credits={credits}
                    size="small"
                    showPurchaseButton={true}
                    onPurchasePress={handlePurchaseCredits}
                    style={styles.creditDisplay}
                />

                <Text style={styles.title}>Select a Photo</Text>
                <Text style={styles.subtitle}>
                    Choose a photo to transform into a sticker
                </Text>

                <PhotoSelectionComponent
                    onImageSelected={handleImageSelected}
                    onError={handleError}
                    processingOptions={{
                        quality: 0.8,
                        maxWidth: 1024,
                        maxHeight: 1024,
                        format: 'jpeg',
                    }}
                />
            </View>

            <InsufficientCreditsModal
                visible={showInsufficientCreditsModal}
                onClose={() => setShowInsufficientCreditsModal(false)}
                onPurchasePress={handlePurchaseCredits}
                requiredCredits={CREDIT_COSTS.STICKER_GENERATION}
                currentCredits={credits}
                action="create a sticker"
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    creditDisplay: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        zIndex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.black,
        textAlign: 'center',
        marginBottom: 10,
        marginTop: 60, // Account for credit display
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.secondary,
        textAlign: 'center',
        marginBottom: 40,
    },
});

export default PhotoSelectionScreen;