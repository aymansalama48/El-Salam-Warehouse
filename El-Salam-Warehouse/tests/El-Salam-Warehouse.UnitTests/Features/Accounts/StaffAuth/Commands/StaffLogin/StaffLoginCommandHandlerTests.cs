using El_Salam_Warehouse.Application.Common.Abstractions.Identity.Authentication;
using El_Salam_Warehouse.Application.Features.Accounts.StaffAuth.Commands.StaffLogin;
using El_Salam_Warehouse.Application.Features.Accounts.StaffAuth.Shared;
using El_Salam_Warehouse.Domain.Common.Results;
using FluentAssertions;
using Moq;
using System;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace El_Salam_Warehouse.UnitTests.Features.Accounts.StaffAuth.Commands.StaffLogin;

// اختبارات وحدة لـ StaffLoginCommandHandler
public class StaffLoginCommandHandlerTests
{
    private readonly Mock<IStaffAuthService> _authServiceMock;
    private readonly StaffLoginCommandHandler _handler;

    public StaffLoginCommandHandlerTests()
    {
        _authServiceMock = new Mock<IStaffAuthService>();
        _handler = new StaffLoginCommandHandler(_authServiceMock.Object);
    }

    // التحقق من نجاح تسجيل الدخول عند إدخال بيانات صحيحة
    [Fact]
    public async Task Handle_WhenCredentialsAreValid_ShouldReturnSuccess()
    {
        // Arrange: تجهيز بيانات الدخول والاستجابة المتوقعة
        var command = new StaffLoginCommand("admin@test.com", "Password123!");
        var expectedResponse = new StaffAuthResponse
        {
            UserId = Guid.NewGuid(),
            Email = "admin@test.com",
            FullName = "Admin Test",
            AccessToken = "jwt-access-token",
            RefreshToken = "refresh-token"
        };

        _authServiceMock
            .Setup(s => s.LoginAsync(command.Email, command.Password, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<StaffAuthResponse>.Success(expectedResponse));

        // Act: تنفيذ الـ Handler
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert: التأكد من نجاح النتيجة وتطابق البيانات
        result.IsSuccess.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Email.Should().Be(command.Email);
        result.Data.AccessToken.Should().Be("jwt-access-token");
    }

    // التحقق من إرجاع فشل عند إدخال بيانات غير صحيحة
    [Fact]
    public async Task Handle_WhenCredentialsAreInvalid_ShouldReturnFailure()
    {
        // Arrange: تجهيز بيانات غير صالحة
        var command = new StaffLoginCommand("wrong@test.com", "WrongPassword");
        var error = new Error("Auth.InvalidCredentials", "بيانات الدخول غير صحيحة.", ErrorType.Failure);

        _authServiceMock
            .Setup(s => s.LoginAsync(command.Email, command.Password, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result<StaffAuthResponse>.Failure(error));

        // Act: تنفيذ الـ Handler
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert: التأكد من فشل النتيجة
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().Contain(error);
    }
}
