import React from 'react';
import { Button, HStack, Text, Icon, Tooltip, useColorModeValue } from '@chakra-ui/react';
import { MdLanguage } from 'react-icons/md';
import { useLanguage } from 'contexts/LanguageContext';

export default function LanguageSwitcher({ size = 'sm' }: { size?: 'xs' | 'sm' | 'md' }) {
  const { language, toggleLanguage, t } = useLanguage();
  const bg = useColorModeValue('secondaryGray.300', 'whiteAlpha.200');
  const textColor = useColorModeValue('navy.700', 'white');
  const activeColor = useColorModeValue('brand.500', 'brand.300');

  return (
    <Tooltip label={t('Dili İngilizce yap (Switch to English)', 'Switch to Turkish (Türkçe\'ye geç)')}>
      <Button
        size={size}
        variant="ghost"
        bg={bg}
        borderRadius="full"
        px="12px"
        h="34px"
        onClick={toggleLanguage}
        _hover={{ opacity: 0.9 }}
      >
        <HStack spacing="6px">
          <Icon as={MdLanguage as any} color={activeColor} w="16px" h="16px" />
          <Text
            fontSize="xs"
            fontWeight="800"
            color={language === 'tr' ? activeColor : textColor}
            opacity={language === 'tr' ? 1 : 0.55}
          >
            TR
          </Text>
          <Text fontSize="xs" color="gray.400">
            /
          </Text>
          <Text
            fontSize="xs"
            fontWeight="800"
            color={language === 'en' ? activeColor : textColor}
            opacity={language === 'en' ? 1 : 0.55}
          >
            EN
          </Text>
        </HStack>
      </Button>
    </Tooltip>
  );
}
