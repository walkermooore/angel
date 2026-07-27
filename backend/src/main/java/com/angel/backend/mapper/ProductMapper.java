package com.angel.backend.mapper;

import com.angel.backend.dto.ProductRequest;
import com.angel.backend.model.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "reservedQuantity", ignore = true)
    @Mapping(target = "soldQuantity", ignore = true)
    Product toEntity(ProductRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "reservedQuantity", ignore = true)
    @Mapping(target = "soldQuantity", ignore = true)
    void updateProductFromRequest(ProductRequest request,
                                  @MappingTarget Product product);

}

